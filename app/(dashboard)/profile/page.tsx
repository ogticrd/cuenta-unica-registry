import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { ProfileInfo } from "@/components/settings/profile-info"

export default function ProfilePage() {
    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto">
                <ProfileInfo />
            </div>
        </DashboardLayout>
    )
}
