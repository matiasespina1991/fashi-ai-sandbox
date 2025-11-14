
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem
} from "@/components/ui/sidebar";
import { Shirt, Video, Loader2, ChevronRight, UserRound, GalleryHorizontal } from "lucide-react";
import { UserNav } from "./user-nav";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [pageTitle, setPageTitle] = useState("Fashi Sandbox");
  const [isMotionVideoOpen, setIsMotionVideoOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user && pathname !== "/login") {
      router.replace("/login");
    }
  }, [user, loading, router, pathname]);
  
  useEffect(() => {
     const isMotionPath = pathname.startsWith('/video-generator');
     setIsMotionVideoOpen(isMotionPath);

    switch (pathname) {
      case "/":
        setPageTitle("Virtual Try-On");
        break;
      case "/avatar-creation":
        setPageTitle("Avatar Creation");
        break;
      case "/avatar-poses":
        setPageTitle("Avatar Poses");
        break;
      case "/video-generator/from-video":
        setPageTitle("Motion Video / From Video");
        break;
      case "/video-generator/from-frames":
        setPageTitle("Motion Video / From Frames");
        break;
      default:
        setPageTitle("Fashi Sandbox");
    }
  }, [pathname]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (pathname === "/login") {
    return <>{children}</>;
  }

  if (!user) {
    return null; // Render nothing while redirecting
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" variant="sidebar">
        <SidebarHeader>
            <SidebarMenuButton
              className="!h-12 justify-start rounded-lg hover:bg-transparent"
              tooltip={{ children: "Fashi Sandbox" }}
              asChild
            >
              <Link href="/">
                <img src="/logos/fashi/fashi_logo.png" alt="Fashi Logo" className="h-auto object-contain" style={{width: '4.7rem'}}/>
              </Link>
            </SidebarMenuButton>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/avatar-creation">
                <SidebarMenuButton
                  isActive={pathname === "/avatar-creation"}
                  tooltip={{ children: "Avatar Creation" }}
                >
                  <UserRound className="h-5 w-5" />
                  <span>Avatar Creation</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/">
                <SidebarMenuButton
                  isActive={pathname === "/"}
                  tooltip={{ children: "Try-On" }}
                >
                  <Shirt className="h-5 w-5" />
                  <span>Virtual Try-On</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <Link href="/avatar-poses">
                <SidebarMenuButton
                  isActive={pathname === "/avatar-poses"}
                  tooltip={{ children: "Avatar Poses" }}
                >
                  <GalleryHorizontal className="h-5 w-5" />
                  <span>Avatar Poses</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
               <Collapsible open={isMotionVideoOpen} onOpenChange={setIsMotionVideoOpen}>
                <CollapsibleTrigger asChild>
                   <SidebarMenuButton
                      isActive={pathname.startsWith('/video-generator')}
                      tooltip={{ children: "Motion Video" }}
                      className="justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Video className="h-5 w-5" />
                        <span>Motion Video Generator</span>
                      </div>
                      <ChevronRight className={`ml-auto h-4 w-4 shrink-0 transition-transform duration-200 text-[#727272] ${isMotionVideoOpen ? 'rotate-90' : ''}`} />
                    </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <SidebarMenuSub>
                        <SidebarMenuSubItem>
                            <Link href="/video-generator/from-video">
                                <SidebarMenuSubButton isActive={pathname === '/video-generator/from-video'}>
                                    Desde Video
                                </SidebarMenuSubButton>
                            </Link>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                             <Link href="/video-generator/from-frames">
                                <SidebarMenuSubButton isActive={pathname === '/video-generator/from-frames'}>
                                    Desde Fotogramas
                                </SidebarMenuSubButton>
                            </Link>
                        </SidebarMenuSubItem>
                    </SidebarMenuSub>
                </CollapsibleContent>
               </Collapsible>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <UserNav />
        </SidebarFooter>
      </Sidebar>
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 py-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 mt-4">
          <SidebarTrigger className="md:hidden" />
          <div className="flex items-baseline gap-2">
            <h1 className="font-headline text-lg font-semibold md:text-xl">
              Fashi Sandbox
            </h1>
            <span className="text-sm text-muted-foreground hidden sm:inline-block">/ {pageTitle}</span>
          </div>
        </header>
        <SidebarInset>{children}</SidebarInset>
      </div>
    </SidebarProvider>
  );
}
