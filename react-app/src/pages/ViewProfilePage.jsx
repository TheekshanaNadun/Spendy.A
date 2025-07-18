import React from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import ProfileView from "../components/ProfileView";
import ChangePassword from "../components/ChangePassword";

const ViewProfilePage = () => {
  return (
    <MasterLayout>
      <Breadcrumb title="View Profile" />
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', minHeight: '80vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)', padding: '40px 0', gap: 32 }}>
        <div style={{ width: 400, background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', padding: 32, marginRight: 32 }}>
          <ProfileView />
        </div>
        <div style={{ width: 400, background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', padding: 32 }}>
          <ChangePassword />
        </div>
      </div>
    </MasterLayout>
  );
};

export default ViewProfilePage; 
