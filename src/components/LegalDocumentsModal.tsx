import React, { useState, useEffect } from 'react';
import { X, FileText, ShieldCheck, Printer, CheckCircle2, ChevronRight, Lock, Phone, Mail, MapPin, ExternalLink } from 'lucide-react';
import { CommonBrewLogo } from './CommonBrewLogo';

interface LegalDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'terms' | 'privacy';
}

export const LegalDocumentsModal: React.FC<LegalDocumentsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'terms'
}) => {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: '#ffffff',
          width: '100%',
          maxWidth: '780px',
          maxHeight: '90vh',
          borderRadius: '20px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          border: '1px solid #e2e8f0'
        }}
      >
        {/* Modal Top Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #e2e8f0',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: '#fff7ed',
                border: '1px solid #ffedd5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ea580c'
              }}
            >
              {activeTab === 'terms' ? <FileText size={22} /> : <ShieldCheck size={22} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                  {activeTab === 'terms' ? 'Terms and Conditions' : 'Privacy Policy'}
                </h2>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    background: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  Official
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                CommonBrew Coffee Taytay • Effective: October 2026
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={handlePrint}
              title="Print Document"
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#475569',
                fontSize: '0.78rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Printer size={15} />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              onClick={onClose}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Switching Navigation */}
        <div
          style={{
            display: 'flex',
            padding: '0.4rem 1.5rem 0',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            gap: '0.5rem'
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            style={{
              padding: '0.65rem 1.25rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              border: 'none',
              background: 'transparent',
              color: activeTab === 'terms' ? '#ea580c' : '#64748b',
              borderBottom: activeTab === 'terms' ? '2.5px solid #ea580c' : '2.5px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              transition: 'all 0.15s ease'
            }}
          >
            <FileText size={16} />
            <span>Terms and Conditions</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            style={{
              padding: '0.65rem 1.25rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              border: 'none',
              background: 'transparent',
              color: activeTab === 'privacy' ? '#ea580c' : '#64748b',
              borderBottom: activeTab === 'privacy' ? '2.5px solid #ea580c' : '2.5px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              transition: 'all 0.15s ease'
            }}
          >
            <ShieldCheck size={16} />
            <span>Privacy Policy</span>
          </button>
        </div>

        {/* Scrollable Document Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '2rem',
            background: '#ffffff',
            lineHeight: 1.65,
            color: '#334155',
            fontSize: '0.9rem'
          }}
        >
          {activeTab === 'terms' ? (
            /* ─────────────────────────────────────────────────────────── */
            /* TERMS AND CONDITIONS CONTENT                               */
            /* ─────────────────────────────────────────────────────────── */
            <div style={{ maxWidth: '680px', margin: '0 auto' }}>
              {/* Document Header */}
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <CommonBrewLogo size="md" />
                </div>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', margin: '0.25rem 0' }}>
                  Terms and Conditions
                </h1>
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
                  Official Customer Agreement & Online Ordering Policy
                </p>
                <div style={{ height: '2px', width: '60px', background: '#ea580c', margin: '0.85rem auto 0', borderRadius: '2px' }} />
              </div>

              <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.75rem' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#9a3412', fontWeight: 500 }}>
                  These Terms and Conditions (<strong>"Agreement"</strong>) govern the use of the official website and online ordering system of <strong>CommonBrew Coffee Taytay</strong> (<strong>"Store"</strong>, <strong>"Site"</strong>, <strong>"we"</strong>, <strong>"us"</strong>). By accessing or using this Site, creating a customer account, placing orders for pickup or delivery, or interacting with our automated barista services, you agree to comply with and be bound by these Terms and Conditions.
                </p>
              </div>

              {/* Section 1 */}
              <section style={{ marginBottom: '1.75rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <span style={{ color: '#ea580c' }}>1.</span> Use of CommonBrew Coffee Taytay Services
                </h3>
                <p style={{ margin: '0 0 0.5rem' }}>
                  CommonBrew Coffee Taytay provides an online web platform for browsing our specialty beverage menu, customizing drinks (sweetness level, ice level, upsize options, and add-ons), placing pickup and delivery orders, tracking order statuses, and making payments through supported channels.
                </p>
                <p style={{ margin: 0 }}>
                  The services are intended for personal and non-commercial customer use only. Any misuse, fraudulent transactions, automated order spamming, or abuse of staff and system features may result in immediate cancellation of orders and denial of access. Customers are required to provide accurate, current, and complete contact and delivery information when submitting orders.
                </p>
              </section>

              {/* Section 2 */}
              <section style={{ marginBottom: '1.75rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <span style={{ color: '#ea580c' }}>2.</span> Online Ordering and Verification
                </h3>
                <p style={{ margin: '0 0 0.5rem' }}>
                  Orders placed through the website are queued for preparation by our on-duty baristas. For orders paid via <strong>GCash</strong>, orders are confirmed upon uploading your downloaded GCash transaction receipt as verified payment proof.
                </p>
                <ul style={{ paddingLeft: '1.25rem', margin: '0.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <li>
                    <strong>Fresh Beverage Policy:</strong> Because all coffee, milktea, and specialty beverages are handcrafted and temperature-sensitive, orders queued into <em>"Preparing"</em> status cannot be cancelled once brewing has started.
                  </li>
                  <li>
                    <strong>Pickup Window:</strong> For Pickup orders, customers are requested to collect their drinks within 20 to 30 minutes of receiving the <em>"Ready for Pickup"</em> notification to experience optimal flavor, temperature, crema, and freshness.
                  </li>
                  <li>
                    <strong>Delivery Orders:</strong> Delivery is fulfilled within our Taytay and designated Rizal servicing perimeter. Customers must ensure that the recipient's mobile number is active and capable of receiving calls or SMS from the rider.
                  </li>
                </ul>
              </section>

              {/* Section 3 */}
              <section style={{ marginBottom: '1.75rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <span style={{ color: '#ea580c' }}>3.</span> Payment Methods
                </h3>
                <p style={{ margin: '0 0 0.5rem' }}>
                  CommonBrew Coffee Taytay currently accepts the following payment methods:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', margin: '0.75rem 0' }}>
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.75rem', background: '#f8fafc' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem', marginBottom: '2px' }}>📱 GCash QR & Express</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Scan official merchant QR code and upload your downloaded GCash payment receipt.</div>
                  </div>
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.75rem', background: '#f8fafc' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem', marginBottom: '2px' }}>💵 Cash on Pickup / Counter</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Pay in physical Philippine Peso cash directly at counter during claim.</div>
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
                  If store QR codes are temporarily unavailable, the checkout page provides direct counter payment instructions or assistance via our on-duty baristas.
                </p>
              </section>

              {/* Section 4 */}
              <section style={{ marginBottom: '1.75rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <span style={{ color: '#ea580c' }}>4.</span> Cancellations and Refunds
                </h3>
                <p style={{ margin: '0 0 0.5rem' }}>
                  Due to the perishable nature of handcrafted drinks and food items, <strong>all orders transitioning into "Preparing" or "Ready" status are non-refundable</strong>.
                </p>
                <p style={{ margin: '0 0 0.5rem' }}>
                  Cancellation requests must be communicated immediately while the order is still marked as <em>"Pending"</em>. In the rare event of a verified store error (e.g., incorrect flavor prepared, missing upsize, or unavailable raw ingredient), CommonBrew Taytay will promptly offer an immediate replacement drink or store credit redemption.
                </p>
              </section>

              {/* Section 5 */}
              <section style={{ marginBottom: '1.75rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <span style={{ color: '#ea580c' }}>5.</span> Customer Responsibilities
                </h3>
                <p style={{ margin: '0 0 0.5rem' }}>
                  Customers are responsible for ensuring that payments are successfully completed and that valid contact details are supplied. Customers agree not to engage in any activity that could damage, disable, or impair the services, databases, or operations of CommonBrew Coffee Taytay.
                </p>
                <p style={{ margin: 0 }}>
                  Customers must check their orders upon turnover at the counter or delivery handover. Any discrepancies must be reported immediately to our cashier or via our contact lines.
                </p>
              </section>

              {/* Section 6 */}
              <section style={{ marginBottom: '1.75rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <span style={{ color: '#ea580c' }}>6.</span> Privacy and Data Protection
                </h3>
                <p style={{ margin: 0 }}>
                  Personal information collected through the website will be used solely for order processing, payment verification, loyalty points tracking, customer support, and official documentation. We strictly adhere to the <strong>Philippine Data Privacy Act of 2012 (Republic Act No. 10173)</strong>. For complete details, please refer to our Privacy Policy.
                </p>
              </section>

              {/* Section 7 */}
              <section style={{ marginBottom: '1.75rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <span style={{ color: '#ea580c' }}>7.</span> Limitations of Liability
                </h3>
                <p style={{ margin: 0 }}>
                  CommonBrew Coffee Taytay shall not be held liable for technical downtime, internet service disruptions, delays caused by severe weather or local road closures in Taytay/Rizal, nor for payment failures resulting from erroneous customer input. The store reserves the right to modify or adjust menu availability and pricing without prior notice based on raw ingredient supply.
                </p>
              </section>

              {/* Section 8 */}
              <section style={{ marginBottom: '1.75rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <span style={{ color: '#ea580c' }}>8.</span> Agreement
                </h3>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem' }}>
                  <p style={{ margin: 0, fontWeight: 600, color: '#0f172a' }}>
                    By proceeding with an order, registering an account, or using this website, you acknowledge that you have read, understood, and agreed to these Terms and Conditions.
                  </p>
                </div>
              </section>

              {/* Contact Footer */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem', marginTop: '2rem', fontSize: '0.8rem', color: '#64748b' }}>
                <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>CommonBrew Coffee Taytay</div>
                <div>Manila East Road, Brgy. San Juan, Taytay, Rizal • Contact: 0947-496-0778 • Email: hello@commonbrewtaytay.com</div>
              </div>
            </div>
          ) : (
            /* ─────────────────────────────────────────────────────────── */
            /* PRIVACY POLICY CONTENT                                     */
            /* ─────────────────────────────────────────────────────────── */
            <div style={{ maxWidth: '680px', margin: '0 auto' }}>
              {/* Document Header */}
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <CommonBrewLogo size="md" />
                </div>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', margin: '0.25rem 0' }}>
                  Privacy Policy
                </h1>
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
                  In compliance with Republic Act No. 10173 (Philippine Data Privacy Act of 2012)
                </p>
                <div style={{ height: '2px', width: '60px', background: '#ea580c', margin: '0.85rem auto 0', borderRadius: '2px' }} />
              </div>

              {/* Introduction */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.75rem' }}>
                <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                  Introduction
                </h4>
                <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem' }}>
                  At <strong>CommonBrew Coffee Taytay</strong>, we value your trust and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, store, and safeguard the personal data you provide to us when using our website, online ordering system, loyalty program, or any of our customer support channels.
                </p>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>
                  By accessing or using the CommonBrew website or making a purchase through our online system, you acknowledge and consent to the practices described in this Privacy Policy.
                </p>
              </div>

              {/* 1. Information We Collect */}
              <section style={{ marginBottom: '1.75rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                  1. Information We Collect
                </h3>
                <p style={{ margin: '0 0 0.5rem' }}>
                  We collect the following types of personal information from users:
                </p>
                <ol style={{ paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <li><strong>Full Name</strong> — For order identification and personalized customer service.</li>
                  <li><strong>Email Address</strong> — For digital official receipts, account verification OTPs, and order notifications.</li>
                  <li><strong>Contact Number (Mobile)</strong> — For order confirmation calls and courier delivery dispatch.</li>
                  <li><strong>Delivery Address & Landmark</strong> — Required for accurate doorstep dispatch of orders.</li>
                  <li><strong>Booking and Order Details</strong> — Including items ordered, sugar and ice preferences, add-ons, pickup time, and special barista instructions.</li>
                  <li><strong>Payment Information</strong> — Such as transaction reference numbers and uploaded payment screenshots for verification. (We do not store credit card numbers).</li>
                  <li><strong>Messages or Inquiries</strong> — Inquiries sent through our customer chatbot, feedback forms, or support lines.</li>
                </ol>
              </section>

              {/* 2. How We Collect Information */}
              <section style={{ marginBottom: '1.75rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                  2. How We Collect Information
                </h3>
                <p style={{ margin: '0 0 0.5rem' }}>
                  We collect personal data through:
                </p>
                <ul style={{ paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <li>Online checkout and order placement forms</li>
                  <li>Customer account registration and OTP verification</li>
                  <li>Payment reference submission and verification proof uploads</li>
                  <li>Chatbot or messaging features on the website (CommonBrew AI Barista)</li>
                  <li>Secure session tokens and cookies used to remember your cart items and active session</li>
                </ul>
              </section>

              {/* 3. How We Use Your Information */}
              <section style={{ marginBottom: '1.75rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                  3. How We Use Your Information
                </h3>
                <p style={{ margin: '0 0 0.5rem' }}>
                  The personal data collected from users is used to process and confirm orders, verify payment details, and provide transaction receipts. We also use this information to communicate with users regarding their inquiries, order status, or delivery updates.
                </p>
                <p style={{ margin: 0 }}>
                  Furthermore, collected data helps us credit CommonBrew Loyalty Points, improve the functionality of our website, enhance customer service, and maintain accurate records for administrative, operational, and BIR tax compliance purposes.
                </p>
              </section>

              {/* 4. How We Store and Protect Your Data */}
              <section style={{ marginBottom: '1.75rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                  4. How We Store and Protect Your Data
                </h3>
                <p style={{ margin: 0 }}>
                  All information submitted through the CommonBrew system is stored in secured databases (Supabase PostgreSQL / Cloud SQL). We implement industry-standard security measures such as bcrypt password hashing, encrypted SSL/TLS data transmission, and role-based administrative access to ensure that your data is protected from unauthorized access, alteration, or disclosure.
                </p>
              </section>

              {/* 5. Who Has Access to the Data */}
              <section style={{ marginBottom: '1.75rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                  5. Who Has Access to the Data
                </h3>
                <p style={{ margin: 0 }}>
                  Access to personal data is strictly limited to authorized CommonBrew Coffee Taytay staff, managers, and baristas who require the information to prepare orders, verify payment proofs, and assist customers. Unauthorized individuals are strictly prohibited from viewing or handling customer data.
                </p>
              </section>

              {/* 6. Sharing of Data */}
              <section style={{ marginBottom: '1.75rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                  6. Sharing of Data
                </h3>
                <p style={{ margin: '0 0 0.5rem' }}>
                  <strong>We do not sell, rent, or trade user data to third parties.</strong>
                </p>
                <p style={{ margin: 0 }}>
                  Personal data is accessible only to authorized personnel for operational purposes. The service utilizes trusted infrastructure providers: database hosting via Supabase/Cloud SQL and AI-assisted menu recommendations powered by the Google Gemini API. These providers process data on behalf of CommonBrew Coffee Taytay under strict confidentiality and privacy obligations. CommonBrew does not share customer data with any other external parties unless required by law.
                </p>
              </section>

              {/* 7. Data Retention */}
              <section style={{ marginBottom: '1.75rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                  7. Data Retention
                </h3>
                <p style={{ margin: 0 }}>
                  We retain customer order history and transaction records for reference, loyalty point balance tracking, and legal/tax compliance (official receipt archiving). Information is securely stored and accessible only to authorized administrative personnel.
                </p>
              </section>

              {/* 8. Data Security */}
              <section style={{ marginBottom: '1.75rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                  8. Data Security
                </h3>
                <p style={{ margin: 0 }}>
                  We apply reasonable administrative, technical, and physical measures to help protect personal data against loss, unauthorized access, alteration, or disclosure. All digital records are stored in a protected database with controlled access to maintain confidentiality and integrity.
                </p>
              </section>

              {/* 9. User Rights (RA 10173) */}
              <section style={{ marginBottom: '1.75rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                  9. User Rights
                </h3>
                <p style={{ margin: '0 0 0.5rem' }}>
                  Under the Philippine Data Privacy Act of 2012 (RA 10173), you are entitled to the following rights:
                </p>
                <ul style={{ paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <li><strong>Right to be Informed</strong> — Understanding what data is collected and how it is used.</li>
                  <li><strong>Right to Access</strong> — Requesting a copy of the personal information we hold about you.</li>
                  <li><strong>Right to Rectification</strong> — Requesting corrections to inaccurate or outdated information.</li>
                  <li><strong>Right to Erasure or Blocking</strong> — Requesting the deletion or suspension of your account data.</li>
                </ul>
              </section>

              {/* 10. Contact Information */}
              <section style={{ marginBottom: '1.75rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                  10. Contact Information
                </h3>
                <p style={{ margin: '0 0 0.75rem' }}>
                  For privacy concerns, data inquiries, or requests related to your personal information, you may contact CommonBrew Coffee Taytay through the following:
                </p>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
                  <div><strong>Store Name:</strong> CommonBrew Coffee Taytay</div>
                  <div><strong>Contact Nos.:</strong> 0947-496-0778 / (02) 8983-8038</div>
                  <div><strong>Email:</strong> hello@commonbrewtaytay.com / commonbrewcoffee@gmail.com</div>
                  <div><strong>Address:</strong> Manila East Road, Brgy. San Juan, Taytay, Rizal (Near Club Manila East)</div>
                  <div><strong>Facebook Page:</strong> CommonBrew Taytay</div>
                  <div><strong>Operating Hours:</strong> Monday to Sunday, 10:00 AM – 10:00 PM</div>
                </div>
              </section>
            </div>
          )}
        </div>

        {/* Modal Bottom Action Bar */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Lock size={13} style={{ color: '#10b981' }} />
            <span>Compliant with Philippine Data Privacy Act of 2012</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.55rem 1.25rem',
              background: '#0f172a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            I Understand & Close
          </button>
        </div>
      </div>
    </div>
  );
};
