import React, { useState, useEffect, useRef } from "react";
import * as Tone from "tone";

export default function App() {
  const playerRef = useRef(null);
  const pitchShiftRef = useRef(null);
  const reverbRef = useRef(null);
  const eq3Ref = useRef(null);

  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [pitch, setPitch] = useState(0);
  const [reverbDecay, setReverbDecay] = useState(1.5);
  const [eq, setEq] = useState({ low: 0, mid: 0, high: 0 });
  const [error, setError] = useState(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    let isMounted = true;

    async function setup() {
      try {
        const player = new Tone.Player({
          url: "/demo.mp3",
          onload: () => isMounted && setIsReady(true),
          onerror: (err) => isMounted && setError(`Erreur de chargement audio: ${err}`)
        });

        const pitchShift = new Tone.PitchShift(pitch);
        const reverb = new Tone.Reverb(reverbDecay);
        await reverb.generate();

        const eq3 = new Tone.EQ3(eq.low, eq.mid, eq.high);

        player.chain(pitchShift, reverb, eq3, Tone.Destination);

        playerRef.current = player;
        pitchShiftRef.current = pitchShift;
        reverbRef.current = reverb;
        eq3Ref.current = eq3;
      } catch (err) {
        isMounted && setError(`Erreur d'initialisation: ${err.message}`);
      }
    }

    setup();

    return () => {
      isMounted = false;
      playerRef.current?.stop();
      playerRef.current?.dispose();
      pitchShiftRef.current?.dispose();
      reverbRef.current?.dispose();
      eq3Ref.current?.dispose();
    };
  }, [eq.high,eq.low,eq.mid,pitch,reverbDecay]);

  useEffect(() => {
    if (pitchShiftRef.current) {
      pitchShiftRef.current.pitch = pitch;
    }
  }, [pitch]);

  useEffect(() => {
    if (reverbRef.current) {
      reverbRef.current.decay = reverbDecay;
      reverbRef.current.generate().catch(err => {
        setError(`Erreur de mise à jour de la réverbération: ${err}`);
      });
    }
  }, [reverbDecay]);

  useEffect(() => {
    if (eq3Ref.current) {
      eq3Ref.current.low.value = eq.low;
      eq3Ref.current.mid.value = eq.mid;
      eq3Ref.current.high.value = eq.high;
    }
  }, [eq.high,eq.low,eq.mid,pitch,reverbDecay]);

  const togglePlay = async () => {
    try {
      await Tone.start(); // Doit être appelé suite à une interaction utilisateur
      if (!playerRef.current || !isReady) return;

      if (!isPlaying) {
        playerRef.current.playbackRate = playbackRate;
        playerRef.current.start();
      } else {
        playerRef.current.stop();
      }

      setIsPlaying(prev => !prev);
    } catch (err) {
      setError("Erreur de lecture audio : " + err.message);
    }
  };

  const handlePlaybackRateChange = (e) => {
    const value = parseFloat(e.target.value);
    setPlaybackRate(value);
    if (playerRef.current) {
      playerRef.current.playbackRate = value;
    }
  };

  const handlePitchChange = (e) => setPitch(parseFloat(e.target.value));
  const handleReverbChange = (e) => setReverbDecay(parseFloat(e.target.value));
  const handleEqChange = (band, val) => {
    setEq(prev => ({ ...prev, [band]: parseInt(val) }));
  };


  // Réinitialiser tous les paramètres
  const resetSettings = () => {
    setPlaybackRate(1);
    setPitch(0);
    setReverbDecay(1.5);
    setEq({ low: 0, mid: 0, high: 0 });
  };

  return (
    <div className="app-container">
      <div className="app-header">
        <h1>🎵 Lecteur Audio Avancé</h1>
        <p className="app-subtitle">Expérimentez avec les effets audio en temps réel</p>
      </div>

      {error && (
        <div className="error-banner">
          <div className="error-icon">⚠️</div>
          <div className="error-message">{error}</div>
          <button className="error-dismiss" onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="control-panel">
        <div className="play-controls">
          <button
            onClick={togglePlay}
            disabled={!isReady}
            className={`play-button ${isPlaying ? 'playing' : ''}`}
          >
            {isPlaying ? (
              <>
                <span className="icon">⏸</span> Pause
              </>
            ) : (
              <>
                <span className="icon">▶️</span> Lecture
              </>
            )}
          </button>
          
          <button 
            onClick={resetSettings} 
            className="reset-button"
            disabled={!isReady}
          >
            <span className="icon">🔄</span> Réinitialiser
          </button>
        </div>

        <div className="control-group">
          <label>Vitesse de lecture: <span className="value">{playbackRate.toFixed(1)}x</span></label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={playbackRate}
            onChange={handlePlaybackRateChange}
            disabled={!isReady}
            className="slider"
          />
        </div>

        <div className="control-group">
          <label>Transposition: <span className="value">{pitch} demi-tons</span></label>
          <input
            type="range"
            min="-12"
            max="12"
            step="1"
            value={pitch}
            onChange={handlePitchChange}
            disabled={!isReady}
            className="slider"
          />
        </div>

        <div className="control-group">
          <label>Réverbération: <span className="value">{reverbDecay}s</span></label>
          <input
            type="range"
            min="0"
            max="5"
            step="0.1"
            value={reverbDecay}
            onChange={handleReverbChange}
            disabled={!isReady}
            className="slider"
          />
        </div>

        <div className="eq-section">
          <div className="eq-header">
            <h3 className="eq-title">Égaliseur 3 Bandes</h3>
            <div className="eq-visualizer">
              <div className="eq-bar low" style={{ height: `${(eq.low + 30) / 60 * 100}%` }}></div>
              <div className="eq-bar mid" style={{ height: `${(eq.mid + 30) / 60 * 100}%` }}></div>
              <div className="eq-bar high" style={{ height: `${(eq.high + 30) / 60 * 100}%` }}></div>
            </div>
          </div>
          
          <div className="eq-band">
            <label>Basses: <span className="value">{eq.low}dB</span></label>
            <input
              type="range"
              min="-30"
              max="30"
              value={eq.low}
              onChange={(e) => handleEqChange("low", e.target.value)}
              disabled={!isReady}
              className="slider eq-low"
            />
          </div>
          
          <div className="eq-band">
            <label>Médiums: <span className="value">{eq.mid}dB</span></label>
            <input
              type="range"
              min="-30"
              max="30"
              value={eq.mid}
              onChange={(e) => handleEqChange("mid", e.target.value)}
              disabled={!isReady}
              className="slider eq-mid"
            />
          </div>
          
          <div className="eq-band">
            <label>Aigus: <span className="value">{eq.high}dB</span></label>
            <input
              type="range"
              min="-30"
              max="30"
              value={eq.high}
              onChange={(e) => handleEqChange("high", e.target.value)}
              disabled={!isReady}
              className="slider eq-high"
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        :root {
          --primary-color: #6c5ce7;
          --secondary-color: #a29bfe;
          --dark-color: #2d3436;
          --light-color: #f5f6fa;
          --success-color: #00b894;
          --error-color: #ff7675;
        }
        
        .app-container {
          max-width: 600px;
          margin: 2rem auto;
          padding: 2rem;
          font-family: 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          color: var(--dark-color);
          background-color: white;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }
        
        .app-header {
          text-align: center;
          margin-bottom: 1.5rem;
        }
        
        .app-header h1 {
          color: var(--primary-color);
          margin-bottom: 0.5rem;
          font-size: 2.2rem;
        }
        
        .app-subtitle {
          color: #636e72;
          font-size: 1rem;
          margin-top: 0;
        }
        
        .error-banner {
          display: flex;
          align-items: center;
          background-color: var(--error-color);
          color: white;
          padding: 0.8rem 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          animation: fadeIn 0.3s ease;
        }
        
        .error-icon {
          font-size: 1.5rem;
          margin-right: 0.8rem;
        }
        
        .error-message {
          flex: 1;
          font-weight: 500;
        }
        
        .error-dismiss {
          background: none;
          border: none;
          color: white;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0 0.5rem;
        }
        
        .control-panel {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        .play-controls {
          display: flex;
          gap: 1rem;
        }
        
        .play-button, .reset-button {
          flex: 1;
          background-color: var(--primary-color);
          color: white;
          border: none;
          padding: 12px 24px;
          font-size: 1.1rem;
          border-radius: 50px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 6px rgba(108, 92, 231, 0.3);
        }
        
        .reset-button {
          background-color: #636e72;
        }
        
        .play-button:hover:not(:disabled),
        .reset-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 8px rgba(0, 0, 0, 0.2);
        }
        
        .play-button:disabled,
        .reset-button:disabled {
          background-color: #b2bec3;
          cursor: not-allowed;
        }
        
        .play-button.playing {
          background-color: var(--success-color);
          box-shadow: 0 4px 6px rgba(0, 184, 148, 0.3);
        }
        
        .play-button.playing:hover {
          background-color: #00a383;
          box-shadow: 0 6px 8px rgba(0, 184, 148, 0.4);
        }
        
        .icon {
          font-size: 1.2rem;
        }
        
        .control-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .control-group label {
          display: flex;
          justify-content: space-between;
          font-weight: 500;
          color: var(--dark-color);
        }
        
        .value {
          color: var(--primary-color);
          font-weight: bold;
          min-width: 60px;
          text-align: right;
        }
        
        .slider {
          -webkit-appearance: none;
          width: 100%;
          height: 8px;
          border-radius: 4px;
          background: #dfe6e9;
          outline: none;
          opacity: 0.7;
          transition: opacity 0.2s;
        }
        
        .slider:hover {
          opacity: 1;
        }
        
        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--primary-color);
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          background: #5649d1;
        }
        
        .eq-section {
          background-color: #f8f9fa;
          padding: 1.5rem;
          border-radius: 10px;
          margin-top: 1rem;
        }
        
        .eq-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
        }
        
        .eq-title {
          color: var(--primary-color);
          margin: 0;
          font-size: 1.3rem;
        }
        
        .eq-visualizer {
          display: flex;
          align-items: flex-end;
          height: 50px;
          width: 80px;
          gap: 8px;
          padding: 5px;
          background: #e0e0e0;
          border-radius: 4px;
        }
        
        .eq-bar {
          flex: 1;
          background: var(--primary-color);
          border-radius: 2px;
          transition: height 0.2s ease;
        }
        
        .eq-bar.low { background: #0984e3; }
        .eq-bar.mid { background: #00b894; }
        .eq-bar.high { background: #e84393; }
        
        .eq-band {
          margin-bottom: 1.2rem;
        }
        
        .eq-band:last-child {
          margin-bottom: 0;
        }
        
        .eq-low::-webkit-slider-thumb {
          background: #0984e3;
        }
        
        .eq-mid::-webkit-slider-thumb {
          background: #00b894;
        }
        
        .eq-high::-webkit-slider-thumb {
          background: #e84393;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}