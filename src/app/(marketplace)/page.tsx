import ShoppableReelsFeed, { ReelItem } from "@/components/discovery/ShoppableReelsFeed";

// Sample mock data for instant verification
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

export default function DiscoveryPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6 text-center sm:text-left">
        <h1 className="text-2xl font-black tracking-tight">Trending Shoppable Reels</h1>
        <p className="text-sm text-muted-foreground">Discover and buy products directly from creator videos</p>
      </div>

      <ShoppableReelsFeed 
        reels={sampleReels} 
        onAddToCart={(product) => {
          // Hook up your cart logic here (e.g., Zustand store or Context API)
          console.log("Added to cart from reel:", product);
        }}
      />
    </div>
  );
}
