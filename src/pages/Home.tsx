import { useAuth } from "@/context/useAuth"
import { Navigate } from "react-router-dom"

export default function Home() {
    const {user, isLoading} = useAuth();

    if (user && !isLoading) {
        return <Navigate to="/profile" replace/>
    }

    return (
        <div>
            <h1>Home</h1>
        </div>
    )
}
