import React from "react";
import ShoppableReelsFeed, { ReelItem } from "@/components/discovery/ShoppableReelsFeed";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const sampleReels: ReelItem[] = [
  {
    id: 1,
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-girl-in-a-clothing-store-checking-out-a-dress-41584-large.mp4",
    caption: "Styling the new Stone Town summer collection! Perfect breathable linen for the coast 🌊✨ #DukaJanja #Fashion",
    creatorName: "AishaStyles",
    creatorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    likesCount: 1420,
    commentsCount: 84,
    product: {
      id: "prod-101",
      title: "Zanzibar Coast Linen Shirt - Gold/White",
      price: 45000,
      currency: "TZS",
      image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=200&auto=format&fit=crop&q=80"
    }
  }
];

export default async function MarketplaceHomePage() {
  try {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div className="text-center sm:text-left space-y-2">
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-orange-600 via-amber-500 to-yellow-500 bg-clip-text text-transparent">
            Welcome to Duka Janja Marketplace
          </h1>
          <p className="text-sm text-muted-foreground">
            East Africa’s premier social commerce destination. Discover trending video reels and shop directly.
          </p>
        </div>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">Trending Shoppable Reels</h2>
          </div>

          <ShoppableReelsFeed 
            reels={sampleReels} 
            onAddToCart={(product) => {
              console.log("Added to cart:", product);
            }}
          />
        </section>
      </div>
    );
  } catch (err: any) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-lg font-bold text-destructive">Runtime Rendering Exception</h2>
        <pre className="bg-muted p-4 rounded-xl text-xs text-left overflow-auto max-w-lg mx-auto font-mono">
          {err?.message || JSON.stringify(err)}
        </pre>
      </div>
    );
  }
}
