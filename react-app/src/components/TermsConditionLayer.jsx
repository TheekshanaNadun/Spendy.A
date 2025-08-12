import React, { useState } from 'react';

const TermsConditionLayer = () => {
  const [expandedSection, setExpandedSection] = useState(null);

  const sections = [
    {
      title: 'Acceptance of Terms',
      content: `By accessing and using Spendy.AI ("Service"), you acknowledge and agree to these Terms and Conditions. These terms constitute a legally binding agreement between you ("User", "you", or "your") and Spendy.AI ("we", "us", or "our"). If you do not agree with any part of these terms, you must not use our service.

      1.1 Service Description
      Spendy.AI provides financial management and tracking tools, including but not limited to expense tracking, budgeting, and financial visualization services.

      1.2 User Agreement
      By using our service, you confirm that you are at least 18 years of age and possess the legal authority to enter into this agreement.`
    },
    {
      title: 'User Responsibilities',
      content: `2.1 Account Security
      - You are responsible for maintaining the confidentiality of your account credentials
      - You must immediately notify us of any unauthorized use of your account
      - You agree not to share your account access with third parties

      2.2 Prohibited Activities
      Users shall not:
      - Attempt to gain unauthorized access to our systems or other user accounts
      - Upload or transmit malicious code or content
      - Use the service for any illegal purposes
      - Interfere with or disrupt the service or servers
      
      2.3 Data Accuracy
      - You are responsible for the accuracy of all data you input
      - You agree to keep your account information updated
      - We reserve the right to verify the accuracy of provided information`
    },
    {
      title: 'Privacy and Data Protection',
      content: `3.1 Data Collection
      We collect and process personal data as described in our Privacy Policy. This includes:
      - Account information
      - Transaction data
      - Usage statistics
      - Device information

      3.2 Data Security
      We implement industry-standard security measures to protect your data, including:
      - End-to-end encryption
      - Regular security audits
      - Secure data storage protocols`
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
        }}>Terms and Conditions</h1>
        <p style={{
          color: '#666',
          fontSize: '16px'
        }}>Effective Date: 2/10/2025</p>
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
                borderRadius: '8px'
              }}
            >
              <span style={{
                fontSize: '24px',
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
                fontSize: '16px'
              }}>
                {section.content}
              </div>
            )}
          </div>
        ))}
      </div>


    </div>
  );
};

export default TermsConditionLayer;
