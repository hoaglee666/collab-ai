import { Component, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiService } from '../../../core/services/ai'; // Import service

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.html',
  styles: [
    `
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }
      .typing-dot {
        animation: bounce 1.4s infinite ease-in-out both;
      }
      .typing-dot:nth-child(1) {
        animation-delay: -0.32s;
      }
      .typing-dot:nth-child(2) {
        animation-delay: -0.16s;
      }
      @keyframes bounce {
        0%,
        80%,
        100% {
          transform: scale(0);
        }
        40% {
          transform: scale(1);
        }
      }
    `,
  ],
})
export class ChatbotComponent {
  private aiService = inject(AiService);

  isOpen = signal(false);
  isLoading = signal(false);
  userMessage = '';

  // Initial Welcome Message
  messages = signal<{ sender: 'user' | 'ai'; text: string }[]>([
    {
      sender: 'ai',
      text: 'Hi! I am your Project Advisor. Ask me about your deadlines, progress, or what to focus on next! 🤖',
    },
  ]);

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  toggleChat() {
    this.isOpen.update((v) => !v);
    if (this.isOpen()) this.scrollToBottom();
  }

  sendMessage() {
    if (!this.userMessage.trim()) return;

    const text = this.userMessage;
    this.userMessage = ''; // Clear input

    // 1. Add User Message
    this.messages.update((msgs) => [...msgs, { sender: 'user', text }]);
    this.scrollToBottom();
    this.isLoading.set(true);

    // 2. Call API
    this.aiService.chatWithAdvisor(text).subscribe({
      next: (res) => {
        this.messages.update((msgs) => [...msgs, { sender: 'ai', text: res.reply }]);
        this.isLoading.set(false);
        this.scrollToBottom();
      },
      error: () => {
        this.messages.update((msgs) => [
          ...msgs,
          {
            sender: 'ai',
            text: 'Sorry, I am having trouble connecting to my brain right now. 🧠💥',
          },
        ]);
        this.isLoading.set(false);
      },
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
}
