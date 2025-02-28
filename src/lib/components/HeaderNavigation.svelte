<script>
    //icons
    import BoxesIcon from "lucide-svelte/icons/boxes";
    import MenuIcon from "lucide-svelte/icons/menu";
    import TrophyIcon from "lucide-svelte/icons/trophy";
    import ListIcon from "lucide-svelte/icons/list-checks";
    import GamepadIcon from "lucide-svelte/icons/gamepad-2";

    //components
    import Connect from "./Connect.svelte";

    //shadcn componentsa
    import * as Sheet from "$lib/components/ui/sheet";
    import { Button } from "$lib/components/ui/button";

    import slapLogo from "$lib/assets/slap.png";
    import xIcon from "$lib/assets/x-icon.png";
    import tgIcon from "$lib/assets/tg-icon.png";
    
    import * as config from "$lib/config";
    import { onMount } from "svelte";
</script>

<header class="bg-background w-full sticky top-0 z-50 flex h-16 items-center border-b px-4 md:px-6">
    <nav class="flex items-center text-lg font-medium md:text-sm">
        <a href="/" class="flex items-center gap-2 font-semibold md:text-base">
            <img src={slapLogo} alt="SLAP Logo" class="h-8 w-8" />
            AvaxSlap
        </a>
        
        <div class="hidden md:flex items-center gap-6 ml-10">
            <a href="/" class="text-sm font-medium transition-colors hover:text-primary flex items-center gap-1">
                <GamepadIcon class="h-4 w-4" />
                Play
            </a>
            <a href="/leaderboard" class="text-sm font-medium transition-colors hover:text-primary flex items-center gap-1">
                <TrophyIcon class="h-4 w-4" />
                Leaderboard
            </a>
            <a href="/whitelist" class="text-sm font-medium transition-colors hover:text-primary flex items-center gap-1">
                <ListIcon class="h-4 w-4" />
                Whitelist
            </a>
        </div>
    </nav>
    
    <!-- Mobile menu button -->
    <Sheet.Root>
        <Sheet.Trigger class="ml-2" asChild let:builder>
            <Button builders={[builder]} variant="outline" size="icon" class="md:hidden">
                <MenuIcon class="h-7 w-7" />
                <span class="sr-only">Toggle menu</span>
            </Button> 
        </Sheet.Trigger>
        <Sheet.Content side="left" class="w-[300px] sm:w-[400px]">
            <Sheet.Header>
                <Sheet.Title>Menu</Sheet.Title>
                <Sheet.Description>Navigate to different sections of the app</Sheet.Description>
            </Sheet.Header>
            <nav class="flex flex-col gap-4 mt-4">
                <a href="/" class="text-sm font-medium transition-colors hover:text-primary">
                    Play
                </a>
                <a href="/leaderboard" class="text-sm font-medium transition-colors hover:text-primary flex items-center gap-2">
                    <TrophyIcon class="h-4 w-4" />
                    Leaderboard
                </a>
                <a href="/whitelist" class="text-sm font-medium transition-colors hover:text-primary flex items-center gap-2">
                    <ListIcon class="h-4 w-4" />
                    Whitelist
                </a>
            </nav>
        </Sheet.Content>
    </Sheet.Root>
    
    <div class="ml-auto flex items-center gap-4">
        <div class="hidden md:flex items-center gap-4">
            <a href={config.TWITTER_URL} target="_blank" rel="noopener noreferrer" class="text-muted-foreground hover:text-foreground">
                <img src={xIcon} alt="X" class="h-5 w-5" />
            </a>
            <a href={config.TELEGRAM_URL} target="_blank" rel="noopener noreferrer" class="text-muted-foreground hover:text-foreground">
                <img src={tgIcon} alt="Telegram" class="h-5 w-5" />
            </a>
        </div>
        <Connect />
    </div>
</header>