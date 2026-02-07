'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

type PartyTab = 'welcome' | 'menu' | 'info';

interface PartyPlanScreenProps {
  onBack: () => void;
}

const TABS: { id: PartyTab; label: string; emoji: string }[] = [
  { id: 'welcome', label: 'Welcome', emoji: '🎉' },
  { id: 'menu', label: 'Menu', emoji: '🍽️' },
  { id: 'info', label: 'Venue & Parking', emoji: '📍' },
];

export function PartyPlanScreen({ onBack }: PartyPlanScreenProps) {
  const [activeTab, setActiveTab] = useState<PartyTab>('welcome');

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="p-6 pb-3 text-center relative">
        <button
          onClick={onBack}
          className="absolute right-4 top-6 p-1 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close party info"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
          </svg>
        </button>
        <div className="text-4xl mb-1">🏈</div>
        <h1 className="font-[var(--font-heading)] text-2xl font-bold text-primary tracking-tight">
          GAME DAY PARTY
        </h1>
        <p className="text-secondary text-sm mt-1">Columbia Tower Club</p>
      </header>

      {/* Tab Navigation */}
      <div
        className="border-b-2 border-[#001B33] sticky top-0 z-[15] bg-[#002244]"
        role="tablist"
        aria-label="Party plan sections"
      >
        <div className="flex">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`${tab.id}-panel`}
                id={`${tab.id}-tab`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 py-3 px-2 text-center relative transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  isActive ? 'text-primary' : 'text-[#A5ACAF]'
                )}
              >
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-lg" aria-hidden="true">{tab.emoji}</span>
                  <span className="text-xs font-bold">{tab.label}</span>
                </div>
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_-2px_8px_rgba(105,190,40,0.5)]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'welcome' && <WelcomeTab />}
        {activeTab === 'menu' && <MenuTab />}
        {activeTab === 'info' && <InfoTab />}
      </div>
    </div>
  );
}

/* ───────── Welcome Tab ───────── */
function WelcomeTab() {
  return (
    <div className="p-6 space-y-6">
      {/* Venue hero image */}
      <div className="rounded-xl overflow-hidden">
        <img
          src="/party/venue-sign.jpg"
          alt="Columbia Tower Club"
          className="w-full h-44 object-cover"
        />
      </div>

      {/* Hero welcome */}
      <div className="bg-card rounded-xl p-6 text-center border border-primary/30">
        <h2 className="font-[var(--font-heading)] text-xl font-bold text-foreground mb-4">
          Welcome to the Party!
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Welcome! You are always welcome to get food from the buffet downstairs too. We have board games available and plenty of entertainment lined up. Please let me know if you have any other questions.
        </p>
      </div>

      {/* Event highlights */}
      <div className="bg-card rounded-xl p-5">
        <h3 className="font-[var(--font-heading)] text-lg font-bold text-primary mb-3">
          What to Expect
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Expect a high-energy game-day experience with a DJ-led kickoff hour, chef-curated action stations refreshed throughout the game, drink specials, raffles, and TVs throughout the space. Perfect whether you&apos;re here for the plays, the commercials, or the halftime show.
        </p>
      </div>

      {/* Quick info cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card rounded-xl p-4 text-center">
          <div className="text-2xl mb-1">🎶</div>
          <div className="font-bold text-foreground text-sm">DJ</div>
          <div className="text-xs text-muted-foreground">Kickoff hour</div>
        </div>
        <div className="bg-card rounded-xl p-4 text-center">
          <div className="text-2xl mb-1">🎟️</div>
          <div className="font-bold text-foreground text-sm">Raffles</div>
          <div className="text-xs text-muted-foreground">Throughout the game</div>
        </div>
      </div>

      {/* Board games */}
      <div className="bg-card rounded-xl p-5">
        <h3 className="font-[var(--font-heading)] text-lg font-bold text-primary mb-3">
          Board Games Available
        </h3>
        <div className="flex flex-wrap gap-2">
          {['Monopoly', 'Clue', 'Yahtzee', 'Trivial Pursuit', 'Pictionary'].map(game => (
            <span
              key={game}
              className="bg-primary/15 text-primary text-sm font-medium px-3 py-1.5 rounded-full border border-primary/30"
            >
              {game}
            </span>
          ))}
        </div>
      </div>

      {/* Champagne branding image */}
      <div className="rounded-xl overflow-hidden">
        <img
          src="/party/champagne.jpg"
          alt="Columbia Tower Club"
          className="w-full h-44 object-cover"
        />
      </div>
    </div>
  );
}

/* ───────── Menu Tab ───────── */

interface MenuStation {
  name: string;
  emoji: string;
  items: { title: string; description?: string }[];
}

const MENU_STATIONS: MenuStation[] = [
  {
    name: 'Drinks',
    emoji: '🍹',
    items: [
      { title: 'Sodas', description: 'Included' },
      { title: 'Rainier', description: '$4' },
      { title: 'Bartender', description: 'In your room' },
    ],
  },
  {
    name: 'Welcoming Spread',
    emoji: '🧀',
    items: [
      { title: 'Cheese and charcuterie' },
      { title: 'Crudite' },
      { title: 'Fruit platter' },
      { title: 'Fresh fried potato chips' },
      { title: 'Dips', description: 'Baba ghanoush, tzatziki, hummus, French onion' },
      { title: 'Olives, pickles, crackers, bread sticks' },
    ],
  },
  {
    name: 'Oyster Bar',
    emoji: '🦪',
    items: [
      { title: 'East Coast vs West Coast Oysters', description: '2 types of each, for as long as they last' },
      { title: 'Accompaniments', description: 'Mignonette, cocktail sauce, lemons, hot sauce' },
    ],
  },
  {
    name: 'New England Station',
    emoji: '🦞',
    items: [
      { title: 'New England Clam Chowder Cups', description: 'Dill oil, oyster cracker' },
      { title: 'Cape Cod Blue Crab Cakes', description: 'Old bay aioli' },
      { title: 'Lobster Rolls', description: 'Maine lobster, melted butter, mayo, celery salt, pickled celery, chive' },
      { title: 'Boston Baked Beans', description: 'Smoked pork belly, molasses, brown sugar' },
    ],
  },
  {
    name: 'Seattle Station',
    emoji: '🐟',
    items: [
      { title: 'Teriyaki Chicken Bao Buns', description: 'Jalapeno, cilantro, carrot and daikon pickle, gochujang teriyaki sauce' },
      { title: 'Cedar Plank Salmon & Rolls', description: 'Citrus and herb cured and roasted king salmon w/ rolls and orange fennel beurre blanc' },
      { title: 'Tuna Poke', description: 'Ahi tuna, Hamachi, yuzu shoyu ponzu, cucumber, seaweed, kimchi, pickled ginger, wasabi furikake' },
      { title: 'Seattle Dog', description: 'Assorted sausages and dogs, grilled jalapenos and onions, cream cheese, potato buns' },
    ],
  },
  {
    name: 'Tailgate',
    emoji: '🏟️',
    items: [
      { title: 'Buffalo & Honey Garlic Sriracha Wings' },
      { title: 'Teriyaki Chicken Bao Buns', description: 'Jalapeno, cilantro, carrot and daikon pickle, gochujang teriyaki sauce' },
      { title: 'Fries' },
      { title: 'Tots' },
      { title: 'Chicken Tenders', description: 'Plain with sauces on the side' },
      { title: 'Sauces', description: 'Ranch, red hot, ketchup, sweet chili sauce' },
    ],
  },
  {
    name: 'Plant Based Station',
    emoji: '🌱',
    items: [
      { title: 'BBQ Shiitake Bao Buns', description: 'Vegan kimchi, fermented chili tofu cream, basil, pickled carrot' },
      { title: 'Poke Bowl', description: 'Charred cucumber, edamame, hijiki, tofu, jalapeno, pineapple, scallion, ao nori, burnt lemon ponzu, pickled ginger, bubu arare' },
      { title: 'Mango Cakes', description: '4th quarter' },
      { title: 'Vegan Chili Dogs', description: 'Vegan chili, vegan dogs, potato buns, onions, jalapenos, mustard, ketchup, relish, vegan cream cheese, vegan cheese' },
      { title: 'Jackfruit Cakes', description: 'Old bay tofu sauce' },
    ],
  },
  {
    name: '4th Quarter Sweets',
    emoji: '🍰',
    items: [
      { title: 'Cookies' },
      { title: 'Brownies' },
      { title: 'Chocolate & Berry Beignets' },
      { title: 'Eclairs' },
      { title: 'Macarons' },
    ],
  },
];

function MenuTab() {
  return (
    <div className="p-6 space-y-4">
      <p className="text-muted-foreground text-sm text-center mb-2">
        Chef-curated action stations refreshed throughout the game
      </p>

      {MENU_STATIONS.map(station => (
        <div key={station.name} className="bg-card rounded-xl overflow-hidden">
          {/* Station header */}
          <div className="bg-primary/10 border-b border-primary/20 px-5 py-3 flex items-center gap-3">
            <span className="text-2xl">{station.emoji}</span>
            <h3 className="font-[var(--font-heading)] text-base font-bold text-primary">
              {station.name}
            </h3>
          </div>
          {/* Station items */}
          <div className="px-5 py-3 divide-y divide-border/50">
            {station.items.map((item, i) => (
              <div key={i} className="py-2.5 first:pt-1 last:pb-1">
                <div className="font-semibold text-foreground text-sm">{item.title}</div>
                {item.description && (
                  <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.description}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ───────── Info / Venue & Parking Tab ───────── */
function InfoTab() {
  return (
    <div className="p-6 space-y-5">
      {/* Venue card */}
      <div className="bg-card rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">🏢</span>
          </div>
          <div>
            <h3 className="font-[var(--font-heading)] text-lg font-bold text-primary">
              Columbia Tower Club
            </h3>
            <p className="text-muted-foreground text-sm mt-1">
              701 5th Ave, 75th Floor<br />
              Seattle, WA 98104
            </p>
          </div>
        </div>
      </div>

      {/* Parking */}
      <div className="bg-card rounded-xl p-5">
        <h3 className="font-[var(--font-heading)] text-lg font-bold text-primary mb-3 flex items-center gap-2">
          <span className="text-xl">🅿️</span> Parking
        </h3>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            The Columbia Center parking garage is accessible from 4th or 5th Avenue. Weekend and evening rates are typically reduced. Street parking is also available in the surrounding blocks.
          </p>
          <p>
            Ride-share drop-off is recommended at the 5th Avenue main entrance.
          </p>
        </div>
      </div>

      {/* Getting there */}
      <div className="bg-card rounded-xl p-5">
        <h3 className="font-[var(--font-heading)] text-lg font-bold text-primary mb-3 flex items-center gap-2">
          <span className="text-xl">🚪</span> Getting In
        </h3>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            Enter through the main lobby at 701 5th Avenue. Take the elevators to the 75th floor. The Columbia Tower Club is at the top of the building with panoramic views of Seattle, the Cascades, and the Olympics.
          </p>
        </div>
      </div>

      {/* Views / nearby */}
      <div className="bg-card rounded-xl overflow-hidden">
        <img
          src="/party/lumen-field.jpg"
          alt="Aerial view of Lumen Field from Columbia Tower Club"
          className="w-full h-44 object-cover"
        />
        <div className="p-5">
          <h3 className="font-[var(--font-heading)] text-lg font-bold text-primary mb-3 flex items-center gap-2">
            <span className="text-xl">🏟️</span> Nearby
          </h3>
          <p className="text-sm text-muted-foreground">
            Located in the heart of downtown Seattle with views of Lumen Field, T-Mobile Park, Elliott Bay, and the city skyline from the 75th floor.
          </p>
        </div>
      </div>
    </div>
  );
}
