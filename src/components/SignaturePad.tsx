import { useRef, useState, useEffect } from 'react';
import { Pen, Check, X, RotateCcw } from 'lucide-react';

interface SignaturePadProps {
  onSign: (signatureData: string) => void;
  onCancel: () => void;
}

export default function SignaturePad({ onSign, onCancel }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);

    // Set drawing style
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Fill background
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

    // Draw signature line
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, canvas.offsetHeight - 30);
    ctx.lineTo(canvas.offsetWidth - 20, canvas.offsetHeight - 30);
    ctx.stroke();

    // Label
    ctx.fillStyle = '#64748b';
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText('Assine aqui', 20, canvas.offsetHeight - 35);
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

    // Redraw line
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, canvas.offsetHeight - 30);
    ctx.lineTo(canvas.offsetWidth - 20, canvas.offsetHeight - 30);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText('Assine aqui', 20, canvas.offsetHeight - 35);

    setHasSignature(false);
  };

  const handleSign = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const signatureData = canvas.toDataURL('image/png');
    onSign(signatureData);
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4 text-aviation-accent">
        <Pen className="w-5 h-5 inline mr-2" />
        Assinatura Digital
      </h3>

      <div className="mb-4">
        <canvas
          ref={canvasRef}
          className="w-full h-40 rounded-lg cursor-crosshair border border-aviation-light"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={clearSignature}
          className="btn-secondary flex-1 flex items-center justify-center"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Limpar
        </button>
        <button
          onClick={onCancel}
          className="btn-secondary flex-1 flex items-center justify-center"
        >
          <X className="w-4 h-4 mr-2" />
          Cancelar
        </button>
        <button
          onClick={handleSign}
          disabled={!hasSignature}
          className="btn-primary flex-1 flex items-center justify-center disabled:opacity-50"
        >
          <Check className="w-4 h-4 mr-2" />
          Assinar
        </button>
      </div>

      <p className="text-xs text-gray-400 mt-4 text-center">
        ⓘ Assinatura digital com registro de IP e timestamp conforme exigências de segurança
      </p>
    </div>
  );
}
