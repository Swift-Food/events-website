import { Metadata } from "next";
import FriendsClient from "./FriendsClient";

export const metadata: Metadata = {
 title: "Friends",
 description: "View your followers and who you're following",
};

export default function FriendsPage() {
 return <FriendsClient />;
}
