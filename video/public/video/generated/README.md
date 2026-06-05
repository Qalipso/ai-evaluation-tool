# Generated cinematic assets (placeholders)

Drop AI-generated backgrounds / inserts here. They are used **only** as
low-opacity backdrops behind the Remotion-rendered UI (all product text,
scores, and labels stay as deterministic Remotion layers for clarity).

Wiring: `<AssetBg src="video/generated/<file>" enabled />` inside a scene.
Backgrounds are gated off by default so the film renders cleanly with no
assets present.

Expected files (suggested prompts in parentheses):

| File | Use | Prompt direction |
|------|-----|------------------|
| `hero-board.png` | Scene 3 reveal bg | dark violet dashboard glow, abstract, no text |
| `claim-pipeline.png` | Scene 5 bg | faint flow lines / evidence scan, near-black |
| `safety-gates.png` | Scene 6 bg | grid of soft glowing panels, security cockpit |
| `final-card.png` | Scene 8 bg | premium dark gradient, violet bloom |
| `evidence-scanner.mp4` | Scene 5 insert | slow scanning sweep loop, subtle |
| `safety-gates-motion.mp4` | Scene 6 insert | gentle pulsing panels loop |
| `verdict-reveal.mp4` | Scene 7 insert | soft green bloom reveal loop |

Generate via the nano-banana (image) / fal.ai (video) pipelines. Keep them
dark, low-contrast, and text-free so captions and UI remain readable.
