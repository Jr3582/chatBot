import { ChatArea } from "../components/ChatArea"
import { StarBackground } from "../components/StarBackground"
import { ThemeToggle } from "../components/ThemeToggle"

export const Home = () => {
    return (
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
            <ThemeToggle></ThemeToggle>
            <StarBackground></StarBackground>
            <ChatArea></ChatArea>
        </div>
    )
}