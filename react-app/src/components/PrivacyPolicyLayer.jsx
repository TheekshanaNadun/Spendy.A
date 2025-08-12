import React, { useState } from 'react';

const PrivacyPolicyLayer = () => {
  const [expandedSection, setExpandedSection] = useState(null);

  const sections = [
    {
      title: 'Information We Collect',
      content: `1.1 Personal Information
      We collect personal information that you provide directly to us, including:
      - Account information (username, email address, password)
      - Profile information (name, contact details)
      - Financial information (expenses, income, budgets)
      - Transaction data and spending patterns
      
      1.2 Automatically Collected Information
      We automatically collect certain information when you use our service:
      - Device information (IP address, browser type, operating system)
      - Usage data (pages visited, features used, time spent)
      - Log data (access times, error logs, performance data)
      
      1.3 Cookies and Tracking Technologies
      We use cookies and similar technologies to:
      - Remember your preferences and settings
      - Analyze how you use our service
      - Provide personalized content and advertisements
      - Ensure security and prevent fraud`
    },
    {
      title: 'How We Use Your Information',
      content: `2.1 Service Provision
      We use your information to:
      - Provide and maintain our financial management services
      - Process transactions and manage your account
      - Send important service updates and notifications
      - Respond to your inquiries and support requests
      
      2.2 Service Improvement
      We analyze usage patterns to:
      - Improve our service functionality and user experience
      - Develop new features and capabilities
      - Optimize performance and security
      - Conduct research and analytics
      
      2.3 Communication
      We may use your contact information to:
      - Send service-related announcements
      - Provide customer support
      - Send marketing communications (with your consent)
      - Comply with legal obligations`
    },
    {
      title: 'Information Sharing and Disclosure',
      content: `3.1 We Do Not Sell Your Data
      Spendy.AI does not sell, rent, or trade your personal information to third parties for their marketing purposes.
      
      3.2 Service Providers
      We may share information with trusted third-party service providers who:
      - Host our infrastructure and databases
      - Process payments and financial transactions
      - Provide analytics and customer support services
      - Help us maintain and improve our service
      
      3.3 Legal Requirements
      We may disclose your information when required by law, including:
      - Responding to legal requests and court orders
      - Protecting our rights and property
      - Preventing fraud and security threats
      - Complying with applicable regulations`
    },
    {
      title: 'Data Security and Protection',
      content: `4.1 Security Measures
      We implement comprehensive security measures to protect your data:
      - End-to-end encryption for sensitive information
      - Secure data centers with physical and digital security
      - Regular security audits and vulnerability assessments
      - Access controls and authentication protocols
      
      4.2 Data Retention
      We retain your information for as long as necessary to:
      - Provide our services to you
      - Comply with legal obligations
      - Resolve disputes and enforce agreements
      - Maintain business records
      
      4.3 Data Breach Response
      In the event of a data breach, we will:
      - Immediately investigate and contain the breach
      - Notify affected users within 72 hours
      - Report to relevant authorities as required
      - Take corrective actions to prevent future breaches`
    },
    {
      title: 'Your Rights and Choices',
      content: `5.1 Access and Control
      You have the right to:
      - Access and review your personal information
      - Update or correct inaccurate information
      - Request deletion of your account and data
      - Export your data in a portable format
      
      5.2 Communication Preferences
      You can control how we communicate with you:
      - Opt out of marketing communications
      - Choose notification preferences
      - Set privacy and security settings
      - Manage cookie preferences
      
      5.3 Data Portability
      You can request a copy of your data in a machine-readable format for transfer to another service.`
    },
    {
      title: 'Children\'s Privacy',
      content: `6.1 Age Restrictions
      Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.
      
      6.2 Parental Consent
      If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.
      
      6.3 Age Verification
      We may verify your age during account creation to ensure compliance with this policy.`
    },
    {
      title: 'International Data Transfers',
      content: `7.1 Global Operations
      Spendy.AI operates globally and may transfer your data to countries other than your country of residence.
      
      7.2 Data Protection Standards
      We ensure that international data transfers comply with applicable data protection laws and regulations.
      
      7.3 Adequacy Decisions
      When transferring data to countries without adequate data protection laws, we implement appropriate safeguards.`
    },
    {
      title: 'Changes to This Policy',
      content: `8.1 Policy Updates
      We may update this Privacy Policy from time to time to reflect changes in our practices or applicable laws.
      
      8.2 Notification of Changes
      We will notify you of any material changes by:
      - Posting the updated policy on our website
      - Sending email notifications to registered users
      - Displaying prominent notices in our application
      
      8.3 Continued Use
      Your continued use of our service after policy changes constitutes acceptance of the updated terms.`
    }
  ];

  return (
    <div style={{
      maxWidth: '900px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      <div style={{
        textAlign: 'center',
        marginBottom: '40px'
      }}>
        <h1 style={{
          fontSize: '48px',
          color: '#1a2b4e',
          marginBottom: '16px',
          fontWeight: '700'
        }}>Privacy Policy</h1>
        <p style={{
          color: '#666',
          fontSize: '16px'
        }}>Effective Date: 2/10/2025</p>
        <p style={{
          color: '#666',
          fontSize: '16px',
          maxWidth: '600px',
          margin: '20px auto 0'
        }}>
          At Spendy.AI, we are committed to protecting your privacy and ensuring the security of your personal information. 
          This Privacy Policy explains how we collect, use, share, and protect your data when you use our financial management services.
        </p>
      </div>

      <div style={{
        marginBottom: '40px'
      }}>
        {sections.map((section, index) => (
          <div key={index} style={{
            marginBottom: '16px',
            backgroundColor: '#fff',
            borderRadius: '8px',
            border: '1px solid #eef0f2'
          }}>
            <button
              onClick={() => setExpandedSection(expandedSection === index ? null : index)}
              style={{
                width: '100%',
                padding: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                borderRadius: '8px',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              <span style={{
                fontSize: '20px',
                color: '#1a2b4e',
                fontWeight: '600'
              }}>{section.title}</span>
              <span style={{
                fontSize: '24px',
                color: '#1a2b4e'
              }}>{expandedSection === index ? '−' : '+'}</span>
            </button>
            
            {expandedSection === index && (
              <div style={{
                padding: '0 20px 20px',
                color: '#4a5568',
                lineHeight: '1.8',
                fontSize: '16px',
                whiteSpace: 'pre-line'
              }}>
                {section.content}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{
        marginTop: '40px',
        padding: '30px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #e9ecef'
      }}>
        <h3 style={{
          color: '#1a2b4e',
          marginBottom: '20px',
          fontSize: '24px'
        }}>Contact Us</h3>
        <p style={{
          color: '#4a5568',
          lineHeight: '1.6',
          marginBottom: '20px'
        }}>
          If you have any questions about this Privacy Policy or our data practices, please contact us:
        </p>
        <div style={{
          color: '#4a5568',
          lineHeight: '1.6'
        }}>
          <p><strong>Email:</strong> privacy@spendy.ai</p>
          <p><strong>Address:</strong> Colombo, Sri Lanka</p>
          <p><strong>Phone:</strong> +94 11 234 5678</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyLayer;
