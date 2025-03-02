<script>
    import * as Card from "$lib/components/ui/card";
    import { Button } from "$lib/components/ui/button";
    import {Input} from "$lib/components/ui/input";
    import {Label} from "$lib/components/ui/label";
    import { connected, signerAddress, userData } from '$lib/store';
    
</script>

<Card.Root class="h-4/5">
    <Card.Header>
        <Card.Title>Chat</Card.Title>
        <Card.Description>
            Chat with other players
        </Card.Description>
    </Card.Header>
    <Card.Content class="flex-grow overflow-y-auto h-[calc(100%-8rem)]">
        <div class="space-y-4">
            
        </div>
    </Card.Content>
    <Card.Footer class="border-t pt-2">
        <div class="flex gap-2 w-full">
            <Input placeholder="Type a message..." />
            <Button>Send</Button>
        </div>
    </Card.Footer>
</Card.Root>