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
export class ProjectDetailComponent implements OnInit, OnDestroy, AfterViewChecked {
  private route = inject(ActivatedRoute);
  private projectService = inject(ProjectService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private socketService = inject(SocketService);
  private chatService = inject(ChatService);
  private fb = inject(FormBuilder);

  @ViewChild('chatContainer') chatContainer!: ElementRef;
  shouldScroll = false;

  selectedFile: File | null = null; //track image
  project = signal<any>(null);
  tasks = signal<any[]>([]); // <--- New: Store the list of tasks
  isLoading = signal(true);
  newTaskDescription = ''; // <--- New: To hold the input text
  isAiLoading = signal(false);
  isOwner = signal(false);
  isEditing = signal(false); //toggle
  myId = '';
  messages = signal<any[]>([]);
  newMessage = '';
  editForm!: FormGroup;

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
        this.scrollToBottom();

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

  scrollToBottom() {
    this.shouldScroll = true;
  }

  ngAfterViewChecked() {
    if (this.shouldScroll && this.chatContainer) {
      const el = this.chatContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
      this.shouldScroll = false;
    }
  }

  ngOnDestroy() {
    // Good practice: disconnect when leaving the page
    this.socketService.disconnect();
  }

  loadProject(id: string) {
    this.projectService.getProjectById(id).subscribe({
      next: (data) => {
        this.project.set(data);
        // Check if the project's userId matches my ID
        const myId = this.authService.getCurrentUserId(); // We need to create this helper!
        this.isOwner.set(data.userId === myId);
        this.isLoading.set(false);
      },
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

  // --- NEW TASK FUNCTIONS ---

  loadTasks(projectId: string) {
    this.projectService.getTasks(projectId).subscribe({
      next: (data) => this.tasks.set(data),
      error: (err) => console.error(err),
    });
  }

  addTask() {
    if (!this.newTaskDescription.trim() || !this.project()) return;

    this.projectService.createTask(this.project().id, this.newTaskDescription).subscribe({
      next: (newTask) => {
        // Add to list immediately
        this.tasks.update((list) => [...list, newTask]);
        this.newTaskDescription = ''; // Clear input
      },
      error: (err) => alert('Failed to add task'),
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
    if (!this.project()?.description) {
      alert('This project has no description for the AI to read!');
      return;
    }
    this.isAiLoading.set(true);
    //ask ai for ideas
    this.projectService.getAiTasks(this.project().description).subscribe({
      next: (res) => {
        //save to db
        res.tasks.forEach((taskDesc) => {
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

  // Revised Save Method (We will call this from HTML with new values)
  confirmUpdate() {
    if (this.editForm.invalid) return;

    const { name, description, deadline } = this.editForm.value;
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);

    if (deadline) formData.append('deadline', deadline);
    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

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

  //toglg edit
  toggleEdit() {
    this.isEditing.update((v) => !v);

    // If we are ENTERING edit mode, fill the form with current data
    if (this.isEditing()) {
      this.editForm = this.fb.group({
        name: [this.project().name, Validators.required],
        description: [this.project().description],
        deadline: [this.project().deadline], // <--- Pre-fill date
      });
    } else {
      // If cancelling, reset file selection
      this.selectedFile = null;
    }
  }
}
