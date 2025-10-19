"use client";
import ConfidenceTest from "../components/ConfidenceTest";
import { useRouter } from "next/navigation";

const CameraPage = () => {
  const router = useRouter();

  const handleComplete = () => {
    // Navigate to quiz page after confidence test is complete
    router.push("/quiz");
  };

  return (
    <ConfidenceTest onComplete={handleComplete} />
  );
};

export default CameraPage;