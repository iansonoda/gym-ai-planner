import { AccountView, RedirectToSignIn, SignedIn } from "@neondatabase/neon-js/auth/react";
import { useParams } from "react-router-dom";

export default function Account() {
    const { pathname } = useParams();

    if (!pathname) {
        return <RedirectToSignIn />;
    }

    return (
        <SignedIn>
            <div className="min-h-screen pt-24 pb-12 px-6 flex items-center justify-center">
                <div className="w-full max-w-3xl">
                    <AccountView pathname={pathname} />
                </div>
            </div>
        </SignedIn>
    )
}
