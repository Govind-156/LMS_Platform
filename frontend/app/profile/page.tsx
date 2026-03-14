import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ProfileContent } from "@/components/auth/ProfileContent";

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
