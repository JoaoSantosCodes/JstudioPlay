package br.com.jstudioplay.app;

import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Manter a tela ligada durante a reprodução
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        
        // Ativar layout estendido até as bordas da tela
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        
        // Ativar modo imersivo sticky para vídeos e tela cheia sem bordas
        applyImmersiveStickyMode();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            applyImmersiveStickyMode();
        }
    }

    private void applyImmersiveStickyMode() {
        WindowInsetsControllerCompat controller = 
            WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        
        if (controller != null) {
            // Esconder barra de status (relógio, bateria) e barra de navegação virtual (botões voltar, home)
            controller.hide(WindowInsetsCompat.Type.systemBars());
            // Comportamento sticky: ao deslizar da borda, as barras aparecem brevemente e somem sozinhas
            controller.setSystemBarsBehavior(
                WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            );
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            // Fallback para Android legados
            View decorView = getWindow().getDecorView();
            decorView.setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            );
        }
    }
}
