import React from 'react';

const VideoBackground = () => {
  return (
    // Container principal que fixa o vídeo no fundo
    <div className="fixed top-0 left-0 w-full h-screen -z-10">
      
      {/* Tag de vídeo com os atributos corretos */}
      <video
        autoPlay  // Inicia automaticamente
        loop      // Repete o vídeo
        muted     // Essencial para o autoplay funcionar na maioria dos navegadores
        playsInline // Essencial para funcionar inline no iOS
        className="w-full h-full object-cover" // Cobre todo o container
      >
        {/* O Next.js serve arquivos da pasta 'public' diretamente na raiz.
          Portanto, 'public/videos/quiz-bg.mp4' é acessado como '/videos/quiz-bg.mp4' 
        */}
        <source src="/video/quiz-bg.mp4" type="video/mp4" />
        
        {/* Mensagem para navegadores que não suportam o vídeo */}
        Seu navegador não suporta o tag de vídeo.
      </video>

      {/* [IMPORTANTE] Overlay Opcional
        Um vídeo no fundo pode dificultar a leitura do texto.
        É uma boa prática adicionar uma camada escura por cima do vídeo.
        Remova ou ajuste a opacidade (ex: opacity-50) conforme precisar.
      */}
      <div className="absolute top-0 left-0 w-full h-full bg-black opacity-60"></div>
    </div>
  );
};

export default VideoBackground;