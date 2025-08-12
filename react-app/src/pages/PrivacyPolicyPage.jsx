import React from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import PrivacyPolicyLayer from "../components/PrivacyPolicyLayer";

const PrivacyPolicyPage = () => {
  return (
    <>

      {/* MasterLayout */}
      <MasterLayout>

        {/* Breadcrumb */}
        <Breadcrumb title="Privacy Policy" />

        {/* PrivacyPolicyLayer */}
        <PrivacyPolicyLayer />

      </MasterLayout>

    </>
  );
};

export default PrivacyPolicyPage;
