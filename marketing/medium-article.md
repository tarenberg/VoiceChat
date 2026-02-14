# How a Fine Artist Built an AI Voice App in 2026

*By Thomas Arenberg*

---

I've spent thirty years making things with my hands. Oil on canvas, mostly. Murals that cover entire walls. Portraits that take weeks of layering and waiting and looking. I've painted for Mariah Carey and John Mellencamp. In 2005, my work ended up on billboards in Times Square — six of them, lit up over Broadway, which was the kind of surreal moment where you stand on the sidewalk and think: *how did I get here?*

Now I'm standing in a different spot, asking the same question. Because somehow, in 2026, I shipped an AI voice conversation app called Muffin Voice. And I think the path from there to here makes more sense than it sounds.

## The Accidental Pivot

I didn't wake up one morning and decide to become a developer. It was more like a slow drift that turned into a current.

It started with curiosity. I'd been watching AI art tools evolve — the early days of image generation, the debates about creativity and authorship that hit close to home for someone who'd spent decades developing a visual vocabulary by hand. I had opinions. Strong ones. But I also had this nagging feeling that I should understand the thing I had opinions about.

So I started tinkering. Not with image generators — with language models. I wanted to understand how they thought. Or didn't think. Or whatever it is they do that feels uncomfortably close to thinking.

The moment that changed everything was the first time I had a voice conversation with an AI that didn't feel like talking to a machine. It was clunky, sure. There were delays. It misunderstood me constantly. But there was something *there* — a spark of what conversation could feel like if the technology caught up to the idea.

I wanted that future to arrive faster. So I started building it.

## Learning to Code at 50-Something

Let me be honest: I am not a natural programmer. I don't think in data structures. I think in color temperature and negative space and whether the light in a painting is coming from the right direction.

But it turns out that building software and making art have more in common than either community wants to admit. Both are about making decisions in sequence, where each choice constrains and enables the next one. Both require you to hold a complete vision in your head while executing one tiny detail at a time. Both punish you for skipping the fundamentals.

The biggest difference? Paint dries and stays where you put it. Code does whatever it wants.

I leaned heavily on AI to learn. The irony isn't lost on me — using AI to build an AI app. But I think that's actually the point. These tools are most powerful when they meet someone who has a clear vision but lacks a specific technical skill. I knew exactly what I wanted the experience to feel like. I just needed help with the syntax.

## Why Voice?

Here's what I've learned from thirty years of making art: the medium matters. The same idea expressed as an oil painting, a photograph, and a digital print will land completely differently. The texture, the weight, the way light interacts with the surface — these aren't decorations on top of the idea. They *are* the idea.

Voice is like that. When you type a message to an AI, you're in your head. You're editing, backspacing, polishing. When you *talk* to an AI, you're in your body. You're thinking out loud. You're less guarded. The ideas come out differently — rougher, more honest, more surprising.

I wanted to build an app that understood this. That treated voice not as a convenience feature ("Hey assistant, set a timer") but as a fundamentally different way of interacting with intelligence.

## Full-Duplex: The Technical Heart

The core technical decision in Muffin Voice is full-duplex audio. Most voice AI apps work like a walkie-talkie — you talk, then it talks, then you talk. There's a button, or a silence detector, or some other mechanism that manages turn-taking.

Full-duplex means both sides can talk at the same time. It sounds simple. It is not.

Using Google's Gemini API for real-time audio streaming, I built a pipeline where your voice goes up and the AI's voice comes down simultaneously. You can interrupt. You can react. You can say "mmhmm" while the AI is explaining something and it registers that — adjusts, continues, or pivots based on your feedback.

This is how human conversation actually works. We don't take turns cleanly. We overlap, we backtrack, we build on each other in real time. Getting an AI to participate in that dance is technically challenging and, when it works, genuinely magical.

## The Personas

As an artist, I've always been drawn to character. A portrait isn't just a face — it's a personality rendered in paint. The tilt of the head, the tension in the mouth, the light in the eyes. These choices tell you who someone is before they say a word.

I brought that sensibility to Muffin Voice's eight personas. Each one has a distinct personality, conversation style, and purpose. Some are warm and encouraging. Some are sharp and challenging. Some are playful. The goal isn't novelty — it's recognizing that you don't want the same conversational partner at 7 AM when you're journaling your thoughts as you do at 10 PM when you're brainstorming a creative project.

## Ambient Sounds: Designing the Space

This is where the artist in me probably shows most clearly. Muffin Voice includes ambient soundscapes — rain, a coffee shop, a fireplace, and others. They play softly behind the conversation.

This might seem like a gimmick. It's not.

When you paint, the environment matters enormously. The light in your studio, the music you play, the temperature of the room — all of it influences the work. The same principle applies to conversation. A soft rain sound in the background changes how you talk. It slows you down. It makes you more reflective. A coffee shop ambience does the opposite — it energizes, it makes you feel like you're in public, performing your thoughts.

I spent a surprising amount of time on this feature because I think it's the kind of detail that separates "using a tool" from "having an experience."

## Camera: Seeing Together

One of my favorite features is camera support. You can point your phone's camera at something — a painting, a sunset, a broken appliance, whatever — and talk about it with the AI. It sees what you see and brings that into the conversation.

For me, this connects directly to my life as an artist. I've spent decades looking at things carefully and talking about what I see. Color mixing, composition, the way shadows fall across a surface. Having an AI that can look at the same thing and engage with it visually feels like the most natural extension of how I already interact with the world.

## Memory: The Long Conversation

Muffin Voice remembers previous conversations. Not just transcripts — context. If you told it about a project you're working on last Tuesday, it knows about it today. If you mentioned your kid's name, it remembers.

This matters because relationships are built on continuity. The best conversations aren't isolated events — they're chapters in an ongoing story. Memory turns a tool into a companion.

## Art and AI: Not Enemies

I get asked about this constantly. "As an artist, aren't you worried about AI?" And I understand the question. I watched AI image generators get trained on artists' work without permission. I've seen the economic pressure on illustrators and designers. These are real problems that deserve real solutions.

But I also believe that the intersection of art and technology has always produced the most interesting work. Oil paint was once a technological innovation. Photography was going to kill painting (it didn't — it freed painting to become abstract). Digital tools transformed graphic design.

AI is the next one. It's messy and disruptive and often unfair. But the artists who engage with it — who bring their taste, their vision, their decades of learning what makes something resonate — those artists are going to make the most interesting things.

I didn't build Muffin Voice despite being an artist. I built it *because* I'm an artist. Every decision about how it looks, sounds, and feels comes from thirty years of thinking about how humans experience things. That's not something you can automate.

## What's Next

Muffin Voice is free and open source. I'm not trying to build a startup. I'm trying to build something beautiful and useful, the same way I've approached every painting I've ever made.

If you want to try it, it's on the Google Play Store. If you want to see how it works under the hood, the code is on GitHub. And if you want to tell me what's broken or what could be better, I'm listening.

That's the whole point, really. Listening.

---

*Muffin Voice is available on Android. [Download on Google Play](https://play.google.com/store/apps/details?id=com.arenberg.muffinvoice) | [GitHub](https://github.com/tarenberg/VoiceChat)*
