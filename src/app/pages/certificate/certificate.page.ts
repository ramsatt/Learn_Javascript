
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LoadingController, ToastController, Platform } from '@ionic/angular';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-certificate',
  templateUrl: './certificate.page.html',
  styleUrls: ['./certificate.page.scss'],
  standalone: false,
})
export class CertificatePage implements OnInit {
  @ViewChild('certificateNode', { static: false }) certificateNode!: ElementRef;
  
  generatedImage: string | null = null;
  generatedId: string = '';
  
  userName: string = '';
  courseName: string = '';
  completionDate: string = '';
  showInput: boolean = true;

  constructor(
      private route: ActivatedRoute,
      private loadingCtrl: LoadingController,
      private toastCtrl: ToastController,
      private platform: Platform,
      private authService: AuthService
  ) { }

  ngOnInit() {
    const courseId = this.route.snapshot.paramMap.get('course') || 'javascript';
    this.courseName = this.formatCourseName(courseId);
    
    const date = new Date();
    this.completionDate = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    // Random Certificate ID
    this.generatedId = Math.random().toString(36).substring(2, 10).toUpperCase();

    // Auto-fill name if logged in
    const user = this.authService.getCurrentUser();
    if (user && user.displayName) {
        this.userName = user.displayName;
        this.showInput = false; // direct to certificate if we know the user
    }
  }

  formatCourseName(id: string): string {
      const names: {[key: string]: string} = {
          'html': 'HTML Fundamentals',
          'css': 'Modern CSS Design',
          'javascript': 'JavaScript Algorithms',
          'python': 'Python Automation',
          'react': 'React.js Development',
          'sql': 'Database Management',
          'java': 'Java Programming',
          'nodejs': 'Node.js Backend'
      };
      return names[id.toLowerCase()] || 'Software Engineering';
  }

  generatePreview() {
      if (!this.userName.trim()) {
          this.presentToast('Please enter your name');
          return;
      }
      this.showInput = false;
  }

  async shareCertificate(type: 'image' | 'pdf') {
      const loading = await this.loadingCtrl.create({
          message: 'Generating Certificate...'
      });
      await loading.present();

      try {
          // Clone the element to avoid transform issues during capture
          const original = this.certificateNode.nativeElement;
          const clone = original.cloneNode(true) as HTMLElement;
          
          // Style the clone to ensure it captures correctly off-screen
          // We append to body to ensure it is rendered for capture
          clone.style.transform = 'none';
          clone.style.margin = '0';
          clone.style.position = 'fixed'; // fixed to avoid scroll issues
          clone.style.top = '-10000px';
          clone.style.left = '-10000px';
          clone.style.width = '800px';
          clone.style.height = '600px'; // Adjusted height
          clone.style.zIndex = '-1000';
          clone.style.display = 'flex'; // Ensure flex layout is preserved
          document.body.appendChild(clone);

          // brief delay to ensure render
          await new Promise(resolve => setTimeout(resolve, 100));

          const canvas = await html2canvas(clone, {
              scale: 2,
              useCORS: true,
              logging: false,
              backgroundColor: '#ffffff',
              allowTaint: true
          });
          
          // One-shot removal
          if (document.body.contains(clone)) {
             document.body.removeChild(clone);
          }

          if (type === 'image') {
              const imageData = canvas.toDataURL('image/png');
              await this.shareFile(imageData, 'certificate.png', 'image/png');
          } else {
              const imgData = canvas.toDataURL('image/png');
              // Landscape, points, width, height
              const pdf = new jsPDF('l', 'px', [canvas.width, canvas.height]);
              pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
              const pdfOutput = pdf.output('datauristring');
              await this.shareFile(pdfOutput, 'certificate.pdf', 'application/pdf');
          }

      } catch (e) {
          console.error(e);
          this.presentToast('Error generating certificate');
      } finally {
          loading.dismiss();
      }
  }

  async shareFile(dataUrl: string, fileName: string, mimeType: string) {
      if (!this.platform.is('capacitor')) {
          // Fallback for web: Download
          const link = document.createElement('a');
          link.href = dataUrl;
          link.download = fileName;
          link.click();
          return;
      }

      try {
          // Write to temp file
          const base64Data = dataUrl.split(',')[1];
          const path = `certificate/${fileName}`;
          
          const result = await Filesystem.writeFile({
              path: path,
              data: base64Data,
              directory: Directory.Cache,
              recursive: true
          });

          await Share.share({
              title: 'My Completion Certificate',
              text: `I just completed the ${this.courseName} on Learn JS!`,
              url: result.uri,
              dialogTitle: 'Share Certificate'
          });
      } catch (e) {
          console.error('Share failed', e);
          this.presentToast('Could not share file');
      }
  }

  async presentToast(msg: string) {
      const toast = await this.toastCtrl.create({
          message: msg,
          duration: 2000,
          position: 'bottom'
      });
      await toast.present();
  }
}
