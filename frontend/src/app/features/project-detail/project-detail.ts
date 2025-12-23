// frontend/src/app/features/project-detail/project-detail.component.ts
import {
  Component,
  inject,
  OnInit,
  signal,
  computed,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewChecked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  FormControl,
} from '@angular/forms'; // <--- Import FormsModule for the input
import { ProjectService } from '../../core/services/project';
import { AuthService } from '../../core/services/auth';
import { Router } from '@angular/router';
import { SocketService } from '../../core/services/socket';
import { ChatService } from '../../core/services/chat';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule], // <--- Add FormsModule here
  templateUrl: './project-detail.html',
  styleUrl: './project-detail.scss',
})
export class ProjectDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private projectService = inject(ProjectService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private socketService = inject(SocketService);
  private chatService = inject(ChatService);
  private fb = inject(FormBuilder);

  selectedFile: File | null = null; //track image
  project = signal<any>(null);
  currentUser = this.authService.currentUser;
  tasks = signal<any[]>([]); // <--- New: Store the list of tasks
  isLoading = signal(true);
  newTaskDescription = ''; // <--- New: To hold the input text
  isAiLoading = signal(false);
  //owner check
  isOwner = computed(() => {
    const p = this.project();
    const u = this.currentUser();
    return p && u && p.userId === u.id;
  });
  isMember = computed(() => {
    const p = this.project();
    const u = this.currentUser();
    if (!p || !u) return false;
    // Am I Owner OR in Members list?
    return p.userId === u.id || p.Members.some((m: any) => m.id === u.id);
  });
  allMembers = computed(() => {
    const p = this.project();
    if (!p) return [];

    const members = p.Members || [];
    // If Owner exists, add them to the start of the list
    if (p.Owner) {
      return [p.Owner, ...members];
    }
    return members;
  });
  isEditing = signal(false); //toggle
  myId = '';
  messages = signal<any[]>([]);
  selectedAssigneeId = signal<string>('');
  newMessage = '';
  editForm!: FormGroup;
  inviteEmail = new FormControl('', [Validators.required, Validators.email]);

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  progress = computed(() => {
    const total = this.tasks().length;
    if (total === 0) return 0;
    const completed = this.tasks().filter((t) => t.isCompleted).length;
    return Math.round((completed / total) * 100);
  });

  daysLeft = computed(() => {
    const deadline = this.project()?.deadline;
    if (!deadline) return null;

    const today = new Date();
    const due = new Date(deadline);

    //cal diff in time
    const diffTime = due.getTime() - today.getTime();
    //convert to days
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    const currentUser = this.authService.getCurrentUserId();
    if (currentUser) {
      this.myId = currentUser;
    }
    if (id) {
      this.loadProject(id);
      this.loadTasks(id);

      // 1. Join Real-time Room
      this.socketService.joinProject(id);

      // 2. Listen: New Task Created (by someone else)
      this.socketService.onTaskCreated().subscribe((newTask) => {
        // Only add if it's not already in the list (to prevent duplicates if we added it locally)
        this.tasks.update((list) => {
          const exists = list.find((t) => t.id === newTask.id);
          return exists ? list : [...list, newTask];
        });
      });

      // 3. Listen: Task Updated (checkbox toggled)
      this.socketService.onTaskUpdated().subscribe((updatedTask) => {
        this.tasks.update((list) => list.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
      });

      //load chat history
      // 2. Load Messages & Handle Auto-Scroll
      this.chatService.getMessages(id).subscribe((msgs) => {
        this.messages.set(msgs);

        // ✨ CHECK URL PARAMETER
        // We check this AFTER messages are loaded so there is content to scroll to
        this.route.queryParams.subscribe((params) => {
          if (params['jump'] === 'chat') {
            // Small timeout to allow DOM to render the messages first
            setTimeout(() => {
              this.scrollToBottom();
            }, 300);
          }
        });
      });
      //listen for realtime mes
      this.socketService.onMessageReceived().subscribe((msg) => {
        this.messages.update((old) => [...old, msg]);
        this.scrollToBottom();
      });
      //init empty form
      this.editForm = this.fb.group({
        name: ['', Validators.required],
        description: [''],
        status: [''],
        deadline: [''],
        visibility: ['public'],
      });
    }
  }

  //send mess
  sendMessage() {
    if (!this.newMessage.trim()) return;
    //api
    this.chatService.sendMessage(this.project().id, this.newMessage).subscribe(() => {
      this.newMessage = ''; //clear input
    });
  }

  ngOnDestroy() {
    // Good practice: disconnect when leaving the page
    this.socketService.disconnect();
  }

  loadProject(id: string) {
    this.projectService.getProjectById(id).subscribe({
      next: (data) => this.project.set(data),
      error: (err) => console.error(err),
    });
  }

  deleteProject() {
    if (!confirm('Are you sure you want to delete this project?')) return;
    this.projectService.deleteProject(this.project().id).subscribe({
      next: () => {
        alert('Project deleted.');
        this.router.navigate(['/dashboard']);
      },
      error: () => alert('Could not delete project.'),
    });
  }

  deleteTask(task: any) {
    if (!confirm('Are you sure you want to delete this task?')) return;

    // 1. Optimistic Update (Remove from UI immediately)
    const previousTasks = this.tasks(); // Backup in case of error
    this.tasks.update((list) => list.filter((t) => t.id !== task.id));

    // 2. Call API
    this.projectService.deleteTask(task.id).subscribe({
      error: () => {
        // If server fails, revert the change
        this.tasks.set(previousTasks);
        alert('Failed to delete task');
      },
    });
  }

  // --- NEW TASK FUNCTIONS ---

  loadTasks(projectId: string) {
    this.projectService.getTasks(projectId).subscribe({
      next: (data) => this.tasks.set(data),
      error: (err) => console.error(err),
    });
  }

  addTask() {
    if (!this.newTaskDescription.trim() || !this.project()) return;

    const taskData = {
      description: this.newTaskDescription,
      // ✅ FIX 1: Add parenthesis () to read the signal value
      assigneeId: this.selectedAssigneeId() || null,
    };

    // ✅ FIX 2: Send 'taskData' object, NOT 'this.newTaskDescription'
    this.projectService.createTask(this.project().id, taskData).subscribe({
      next: (newTask) => {
        this.tasks.update((list) => [...list, newTask]);
        this.newTaskDescription = '';
        this.selectedAssigneeId.set('');
      },
      error: (err) => alert('Failed to add task'),
    });
  }

  assignTask(task: any, event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const newAssigneeId = selectElement.value;

    this.projectService.updateTask(task.id, { assigneeId: newAssigneeId }).subscribe({
      next: (updatedTask) => {
        // Update the specific task in the list
        this.tasks.update((tasks) => tasks.map((t) => (t.id === task.id ? updatedTask : t)));
      },
      error: (err) => alert('Failed to assign task'),
    });
  }

  toggleTask(task: any) {
    // Optimistic update (toggle UI immediately before server responds)
    this.tasks.update((list) =>
      list.map((t) => (t.id === task.id ? { ...t, isCompleted: !t.isCompleted } : t))
    );

    this.projectService.toggleTask(task.id).subscribe({
      error: () => {
        // Revert if server fails
        this.tasks.update((list) =>
          list.map((t) => (t.id === task.id ? { ...t, isCompleted: !t.isCompleted } : t))
        );
        alert('Sync failed');
      },
    });
  }

  generateAiTasks() {
    const project = this.project();
    if (!project?.description) {
      alert('This project has no description for the AI to read!');
      return;
    }
    this.isAiLoading.set(true);
    //ask ai for ideas
    this.projectService.getAiTasks(project.id, project.description).subscribe({
      next: (res) => {
        //save to db
        res.tasks.forEach((taskDesc: string) => {
          this.createTaskFromAi(taskDesc);
        });
        this.isAiLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        alert('AI failed to suggest tasks');
        this.isAiLoading.set(false);
      },
    });
  }
  //helper to save silently
  createTaskFromAi(desc: string) {
    this.projectService.createTask(this.project().id, desc).subscribe({
      next: (newTask) => {
        this.tasks.update((list) => [...list, newTask]);
      },
    });
  }

  //save change
  saveProject() {
    const p = this.project();
    // In a real app, use a Form. Here we just read the bound values directly.
    // We will bind inputs to the project signal in HTML (a bit hacky but fast)
    // OR we can send the current values from the UI inputs.

    // Better way: Let's assume the HTML updates the project() signal or we use local variables.
    // For simplicity, we will grab the values from the inputs in the template using "template reference variables"
    // or just bind ngModel if we want to add FormsModule.

    // Let's rely on the updated description/name in the HTML inputs
    // We will pass the new values in the method arguments from HTML for cleanliness.
  }

  inviteMember() {
    if (this.inviteEmail.invalid || !this.inviteEmail.value) return;

    const projectId = this.project().id;
    const email = this.inviteEmail.value;

    this.projectService.addMember(projectId, email).subscribe({
      next: (res) => {
        alert('User added!');
        this.inviteEmail.reset();
        // Refresh project to show new member
        this.loadProject(projectId);
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to add member');
      },
    });
  }

  kickMember(userId: string) {
    if (!confirm('Are you sure you want to remove this member?')) return;

    const projectId = this.project().id;

    this.projectService.removeMember(projectId, userId).subscribe({
      next: () => {
        // Optimistically update the UI (remove from list immediately)
        this.project.update((p) => ({
          ...p,
          Members: p.Members.filter((m: any) => m.id !== userId),
        }));
      },
      error: (err) => alert('Failed to remove member'),
    });
  }

  joinProject() {
    this.isLoading.set(true);
    this.projectService.joinProject(this.project().id).subscribe({
      next: () => {
        alert('Welcome to the team!');
        this.loadProject(this.project().id); // Refresh to see chat/tasks
        this.isLoading.set(false);
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to join');
        this.isLoading.set(false);
      },
    });
  }

  // Revised Save Method (We will call this from HTML with new values)
  confirmUpdate() {
    if (this.editForm.invalid) return;

    const { name, description, deadline, status, visibility } = this.editForm.value;
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);

    if (deadline) formData.append('deadline', deadline);
    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }
    formData.append('status', status);
    formData.append('visibility', visibility);

    this.projectService.updateProject(this.project().id, formData).subscribe({
      next: (res) => {
        this.project.set({ ...this.project(), ...res.project });
        this.isEditing.set(false);
        this.selectedFile = null;
        alert('Project updated!');
      },
      error: () => alert('Update failed'),
    });
  }

  scrollToBottom() {
    setTimeout(() => {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTop =
          this.scrollContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }

  isReadOnly = computed(() => {
    const status = this.project()?.status;
    return status !== 'active';
  });

  //toglg edit
  toggleEdit() {
    this.isEditing.update((v) => !v);

    // If we are ENTERING edit mode, fill the form with current data
    if (this.isEditing()) {
      this.editForm = this.fb.group({
        name: [this.project().name, Validators.required],
        description: [this.project().description],
        deadline: [this.project().deadline], // load current data
        status: [this.project().status],
        visibility: [this.project().visibility],
      });
    } else {
      // If cancelling, reset file selection
      this.selectedFile = null;
    }
  }
}
