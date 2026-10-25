@if exist "%~dp0Jouer-Technoprof-Fenetre.html" (
  @start "" "%~dp0Jouer-Technoprof-Fenetre.html"
) else (
  @if exist "%~dp0Jouer-Technoprof-Journee-Musique.html" (
    @start "" "%~dp0Jouer-Technoprof-Journee-Musique.html"
  ) else (
    @if exist "%~dp0Jouer-Technoprof-Journee-Atelier.html" (
      @start "" "%~dp0Jouer-Technoprof-Journee-Atelier.html"
    ) else (
      @start "" "%~dp0Jouer-Technoprof.html"
    )
  )
)
