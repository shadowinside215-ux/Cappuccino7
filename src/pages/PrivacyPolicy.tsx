import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bento-bg text-bento-ink p-6 md:p-12 font-sans">
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-bento-ink/70 hover:text-bento-ink mb-8 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>

        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-8">Privacy Policy</h1>
        
        <div className="prose prose-neutral prose-invert max-w-none space-y-6 text-bento-ink/80">
          <p className="text-sm opacity-70">Last updated: {new Date().toLocaleDateString()}</p>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-bento-ink">1. Introduction</h2>
            <p>
              Welcome to Cappuccino7. This Privacy Policy explains how we collect, use, disclose, 
              and safeguard your information when you visit our mobile application and website. 
              Please read this privacy policy carefully. If you do not agree with the terms of this 
              privacy policy, please do not access the application.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-bento-ink">2. Information We Collect</h2>
            <h3 className="text-xl font-semibold mt-4 text-bento-ink/90">Personal Data</h3>
            <p>
              We may collect personal identification information from you in a variety of ways, including, 
              but not limited to, when you visit our app, register on the app, place an order, and in 
              connection with other activities, services, features or resources we make available.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account Information:</strong> Name, email address, and profile picture provided via Google Sign-In or manual registration.</li>
              <li><strong>Order Details:</strong> Order history, preferences, and loyalty points.</li>
              <li><strong>Location Data:</strong> Optional location data may be requested for delivery purposes.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-bento-ink">3. How We Use Your Information</h2>
            <p>We may use the information we collect from you in the following ways:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>To create and manage your account.</li>
              <li>To process your transactions and deliver the products and services you request.</li>
              <li>To manage our loyalty program and track your points.</li>
              <li>To improve our app in order to better serve you.</li>
              <li>To send periodic emails regarding your order or other products and services.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-bento-ink">4. Data Storage and Security</h2>
            <p>
              We use Google's Firebase (Authentication and Firestore) to securely store and manage your data. 
              We adopt appropriate data collection, storage and processing practices and security measures 
              to protect against unauthorized access, alteration, disclosure or destruction of your personal 
              information, username, password, transaction information and data stored on our app.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-bento-ink">5. Sharing Your Personal Information</h2>
            <p>
              We do not sell, trade, or rent users' personal identification information to others. 
              We may share generic aggregated demographic information not linked to any personal identification 
              information regarding visitors and users with our business partners, trusted affiliates and 
              advertisers for the purposes outlined above.
            </p>
          </section>
          
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-bento-ink">6. Account Deletion</h2>
            <p>
              You have the right to delete your account and associated personal data. 
              You can request account deletion by contacting us using the information provided below, 
              or through the account settings within the app if available.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-bento-ink">7. Changes to This Privacy Policy</h2>
            <p>
              Cappuccino7 has the discretion to update this privacy policy at any time. When we do, we will 
              revise the updated date at the top of this page. We encourage users to frequently check this page 
              for any changes to stay informed about how we are helping to protect the personal information we collect.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-bento-ink">8. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, the practices of this app, or your dealings 
              with this app, please contact us.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
