
import CallRoom from '@/app/components/CallRoom';

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ peerId: string }>;
  searchParams: Promise<{
    type?: string;
    name?: string;
    incoming?: string;
    callId?: string;
  }>;
}) {
  const { peerId } = await params;

  const {
    type,
    name,
    incoming,
    callId,
  } = await searchParams;

  const kind = type === 'video' ? 'video' : 'audio';
  const peerName = name || 'Contact';
  const isIncoming = incoming === '1';

  return (
    <CallRoom
      peerId={peerId}
      peerName={peerName}
      kind={kind}
      incoming={isIncoming}
      incomingCallId={callId || ''}
    />
  );
}
