<script>
    import * as Card from "$lib/components/ui/card";
    import * as Table from "$lib/components/ui/table";
</script>

<Card.Root class="w-full">
    <Card.Header>
        <Card.Title>Leaderboard</Card.Title>
        <Card.Description>Get your slaps up</Card.Description>
    </Card.Header>
    <Card.Content>
        <div class="rounded-lg overflow-hidden border">
            <Table.Root>
                <Table.Header>
                    <Table.Row class="bg-primary hover:bg-primary border-l border-r">
                        <Table.Head class="text-white font-semibold">Slappee</Table.Head>
                        <Table.Head class="text-white font-semibold">Slaps</Table.Head>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    <Table.Row class="border-l border-r">
                        <Table.Cell>Player Address</Table.Cell>
                        <Table.Cell>8,400 SLAPS</Table.Cell>
                    </Table.Row>
                    <Table.Row class="bg-muted border-l border-r border-b">
                        <Table.Cell>Player Address</Table.Cell>
                        <Table.Cell>8,400 SLAPS</Table.Cell>
                    </Table.Row>
                </Table.Body>
            </Table.Root>
        </div>
    </Card.Content>
</Card.Root>