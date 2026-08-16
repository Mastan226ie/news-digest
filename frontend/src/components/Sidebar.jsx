import {
  LayoutGrid, Globe, Briefcase, MapPin, Flag, TrendingUp,
  Monitor, Landmark, Trophy, FlaskConical, Leaf, HeartPulse, Shield,
  LineChart, Factory, Wifi, Wheat, Map, Building2, MessageSquare, PenTool, BookOpen, GraduationCap, Vote,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const categoryIcons = {
  All: LayoutGrid, National: Landmark, International: Globe, Business: Briefcase,
  Markets: LineChart, Economy: TrendingUp, Industry: Factory, Technology: Monitor,
  Internet: Wifi, Science: FlaskConical, Agriculture: Wheat, Health: HeartPulse,
  Environment: Leaf, Sports: Trophy, States: Map, Cities: Building2,
  "Andhra Pradesh": MapPin, Opinion: MessageSquare, Editorial: PenTool,
  Books: BookOpen, Education: GraduationCap, Elections: Vote,
  Commerce: TrendingUp, Politics: Flag, Regional: MapPin, Geopolitics: Shield,
};

const CATEGORIES = [
  "All", "National", "International", "Business", "Markets", "Economy", "Industry",
  "Technology", "Internet", "Science", "Agriculture", "Health", "Environment",
  "Sports", "States", "Cities", "Andhra Pradesh", "Opinion", "Editorial",
  "Books", "Education", "Elections", "Commerce", "Politics", "Regional", "Geopolitics",
];

export default function Sidebar({ selectedCategory, onSelectCategory }) {
  const { user, signOut } = useAuth();

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-theme-border/60 transition-colors duration-300">
      <nav className="flex items-center gap-5 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {CATEGORIES.map((cat) => {
          const Icon = categoryIcons[cat];
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`flex items-center gap-2 whitespace-nowrap text-xs font-bold tracking-widest uppercase transition-all duration-300 py-1 border-b-2 cursor-pointer ${
                isActive
                  ? "text-theme-fg border-theme-fg scale-105"
                  : "text-theme-muted hover:text-theme-fg border-transparent"
              }`}
            >
              {Icon && (
                <Icon
                  className={`w-3.5 h-3.5 transition-transform duration-300 ${
                    isActive ? "rotate-3 scale-110 text-theme-fg" : ""
                  }`}
                />
              )}
              <span>{cat}</span>
            </button>
          );
        })}
      </nav>

      {user && (
        <div className="flex items-center gap-3 pl-4 md:border-l border-theme-border/60">
          <div className="hidden md:block text-right">
            <p className="text-xs font-bold text-theme-fg">{user.name}</p>
            <p className="text-[10px] text-theme-muted">{user.email}</p>
          </div>
          {user.image ? (
            <img
              src={user.image}
              alt="User Avatar"
              width={32}
              height={32}
              className="w-8 h-8 rounded-full border border-theme-border shadow-sm"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-theme-accent/20 flex items-center justify-center text-theme-accent font-bold text-xs border border-theme-accent/30">
              {user.name?.charAt(0) || "U"}
            </div>
          )}
          {user.role === "admin" && (
            <Link
              to="/admin"
              className="flex items-center gap-1.5 text-xs font-black text-amber-500 hover:text-amber-400 uppercase tracking-widest ml-4 transition-colors cursor-pointer"
              title="Admin Panel"
            >
              <Shield className="w-3.5 h-3.5" />
              Admin
            </Link>
          )}
          <Link
            to="/dashboard"
            className="text-xs font-bold text-theme-muted hover:text-theme-fg uppercase tracking-widest ml-4 transition-colors cursor-pointer"
            title="Dashboard"
          >
            Dashboard
          </Link>
          <button
            onClick={() => signOut()}
            className="text-xs font-bold text-theme-muted hover:text-red-500 uppercase tracking-widest ml-4 transition-colors cursor-pointer"
            title="Sign Out"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
