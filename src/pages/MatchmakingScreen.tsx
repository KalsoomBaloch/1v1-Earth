import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useGameState } from '@/hooks/useGameState';
import { fetchQuestions } from '@/lib/trivia';
import { CountryFlag } from '@/components/CountryFlag';
import { GlobeSpinner } from '@/components/GlobeSpinner';
import { Button } from '@/components/ui/button';

export default function MatchmakingScreen() {
  const navigate = useNavigate();
  const { playerId, countryCode, setRoom, setQuestions, reset } = useGameState();
  const [status, setStatus] = useState<'searching' | 'found' | 'timeout'>('searching');
  const [opponentCountry, setOpponentCountry] = useState('');
  const [countdown, setCountdown] = useState(3);
  const roomIdRef = useRef<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    if (!playerId) {
      navigate('/');
      return;
    }
    findOrCreateRoom();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (subscriptionRef.current) supabase.removeChannel(subscriptionRef.current);
    };
  }, []);

  async function findOrCreateRoom() {
    // Try to join an existing waiting room
    const { data: waitingRooms } = await supabase
      .from('rooms')
      .select('*')
      .eq('status', 'waiting')
      .is('player2_id', null)
      .neq('player1_id', playerId)
      .order('created_at', { ascending: true })
      .limit(1);

    if (waitingRooms && waitingRooms.length > 0) {
      const room = waitingRooms[0];
      roomIdRef.current = room.id;

      // Fetch questions and join room
      const questions = await fetchQuestions();

      await supabase
        .from('rooms')
        .update({ player2_id: playerId, status: 'active', questions })
        .eq('id', room.id);

      // Get opponent info
      const { data: opponent } = await supabase
        .from('players')
        .select('country_code')
        .eq('id', room.player1_id)
        .single();

      const oppCountry = opponent?.country_code || 'UN';
      setOpponentCountry(oppCountry);
      setRoom(room.id, room.player1_id, oppCountry);
      setQuestions(questions);
      setStatus('found');

      // Start countdown
      startCountdown(room.id);
    } else {
      // Create a new room
      const { data: newRoom } = await supabase
        .from('rooms')
        .insert({ player1_id: playerId, status: 'waiting' })
        .select()
        .single();

      if (!newRoom) return;
      roomIdRef.current = newRoom.id;

      // Listen for opponent joining
      const channel = supabase
        .channel(`room-${newRoom.id}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${newRoom.id}` },
          async (payload) => {
            const updated = payload.new as any;
            if (updated.status === 'active' && updated.player2_id) {
              const { data: opponent } = await supabase
                .from('players')
                .select('country_code')
                .eq('id', updated.player2_id)
                .single();

              const oppCountry = opponent?.country_code || 'UN';
              setOpponentCountry(oppCountry);
              setRoom(newRoom.id, updated.player2_id, oppCountry);
              setQuestions(updated.questions || []);
              setStatus('found');
              startCountdown(newRoom.id);
            }
          }
        )
        .subscribe();

      subscriptionRef.current = channel;

      // Timeout after 30 seconds
      timeoutRef.current = setTimeout(() => {
        setStatus('timeout');
        supabase.from('rooms').delete().eq('id', newRoom.id);
      }, 30000);
    }
  }

  function startCountdown(_roomId: string) {
    let count = 3;
    setCountdown(count);
    const interval = setInterval(() => {
      count--;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(interval);
        navigate('/duel');
      }
    }, 1000);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 max-w-[420px] mx-auto">
      {status === 'searching' && (
        <div className="text-center space-y-8">
          <GlobeSpinner />
          <div>
            <h2 className="text-2xl font-bold mb-2">Finding Opponent...</h2>
            <p className="text-muted-foreground text-sm">Searching globally</p>
          </div>
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <CountryFlag code={countryCode} size="lg" />
              <p className="text-xs text-muted-foreground mt-2">You</p>
            </div>
            <span className="text-3xl text-muted-foreground animate-pulse">⚔️</span>
            <div className="text-center">
              <span className="text-6xl animate-pulse">❓</span>
              <p className="text-xs text-muted-foreground mt-2">???</p>
            </div>
          </div>
          <Button variant="ghost" onClick={() => { reset(); navigate('/'); }} className="text-muted-foreground">
            Cancel
          </Button>
        </div>
      )}

      {status === 'found' && (
        <div className="text-center space-y-8">
          <h2 className="text-2xl font-bold text-glow-blue">Opponent Found!</h2>
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <CountryFlag code={countryCode} size="lg" />
              <p className="text-xs text-muted-foreground mt-2">You</p>
            </div>
            <span className="text-3xl">⚔️</span>
            <div className="text-center">
              <CountryFlag code={opponentCountry} size="lg" />
              <p className="text-xs text-muted-foreground mt-2">Opponent</p>
            </div>
          </div>
          <div className="text-8xl font-bold text-primary text-glow-blue animate-pulse">
            {countdown}
          </div>
        </div>
      )}

      {status === 'timeout' && (
        <div className="text-center space-y-6">
          <span className="text-6xl">😔</span>
          <h2 className="text-2xl font-bold">No Opponent Found</h2>
          <p className="text-muted-foreground">Try again in a moment</p>
          <Button onClick={() => { reset(); navigate('/'); }} className="bg-primary text-primary-foreground">
            Back to Home
          </Button>
        </div>
      )}
    </div>
  );
}
