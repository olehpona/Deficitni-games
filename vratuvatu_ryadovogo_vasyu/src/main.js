import { DIFFICULTIES, ITEM_TYPES } from './data/config.js';
import { ALL_UNIQUE_PHRASES } from './data/vasylivka.js';
import { pickEventLine } from './data/dialogues.js';
import { GameLoop } from './engine/GameLoop.js';
import { Camera } from './engine/Camera.js';
import { InputManager } from './engine/InputManager.js';
import { dist } from './engine/Collision.js';
import { GalychMap } from './world/GalychMap.js';
import { MapRenderer } from './world/MapRenderer.js';
import { Player } from './entities/Player.js';
import { Vasya } from './entities/Vasya.js';
import { createGuineaPigs } from './entities/GuineaPig.js';
import { EnemySystem } from './entities/Enemies.js';
import { createWorldPickups, ThrownItemManager } from './entities/Pickups.js';
import { AudioEngine } from './systems/AudioEngine.js';
import { ParticleSystem } from './systems/ParticleSystem.js';
import { ChatFeed } from './systems/ChatFeed.js';
import { AchievementsSystem } from './systems/Achievements.js';
import { MomCallSystem } from './systems/MomCall.js';
import { HUD } from './ui/HUD.js';
import { Minimap } from './ui/Minimap.js';
import { ScreensManager } from './ui/Screens.js';
import { IntroSlideshow } from './ui/IntroSlideshow.js';

const EMPTY_HOUSE_REPLIES = [
  '«Який Вася?! Тут баба Галя живе!»',
  '«Нема тут Васі, шукай в іншому дворі!»',
  '«Хто там гримає?! Вася вчора пробіг повз і зник!»',
  '«Абонент не на районі, йди питай інформаторів!»',
  '«Тут тільки розсада, Васі нема!»',
];

class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    this.camera = new Camera(window.innerWidth, window.innerHeight);
    this.input = new InputManager(this.canvas);
    this.audio = new AudioEngine();
    this.particles = new ParticleSystem();
    this.chat = new ChatFeed(document.getElementById('tg-chat-messages'), this.audio);
    this.achievements = new AchievementsSystem(document.getElementById('toast-container'));
    this.momCall = new MomCallSystem({
      audio: this.audio,
      chat: this.chat,
      particles: this.particles,
      achievements: this.achievements,
      camera: this.camera,
    });

    this.hud = new HUD();
    this.minimap = new Minimap(document.getElementById('minimap-canvas'));
    this.screens = new ScreensManager(this.achievements);
    this.intro = new IntroSlideshow(this.audio);

    this.map = new GalychMap();
    this.mapRenderer = new MapRenderer(this.map);

    this.state = 'BRIEFING'; // BRIEFING | INTRO | PLAYING | ENDING
    this.stage = 1; // 1 = Search clues or knock doors, 2 = Bring pig+beer & open hideout, 3 = Evacuate
    this.cluesFound = 0;
    this.hideoutDiscovered = false;

    this.elapsedTime = 0;
    this.globalTime = 0;
    this.holdProgress = 0;
    this.holdTargetId = null;
    this.urgentWarned = false;
    this.atbWarned = false;
    this.needSuppliesWarned = false;
    this.smokeTimer = 0;
    this.secretFireworkTimer = 0;

    this.bindUIEvents();
    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());

    this.loop = new GameLoop(
      (dt) => this.update(dt),
      () => this.render()
    );
    this.loop.start();
  }

  bindUIEvents() {
    const unlockMenuMusic = () => {
      this.audio.unlockFromUserGesture();
    };
    window.addEventListener('pointerdown', unlockMenuMusic, { once: true });
    window.addEventListener('keydown', unlockMenuMusic, { once: true });

    document.getElementById('btn-start-mission').addEventListener('click', () => {
      const diff = this.screens.selectedDifficulty;
      this.screens.hideAll();
      this.state = 'INTRO';
      this.audio.startMusic('menu');
      this.intro.start(() => {
        this.startRun(diff);
      });
    });

    document.getElementById('btn-mom-call').addEventListener('click', () => {
      if (this.state === 'PLAYING') {
        this.momCall.trigger(this.vasya);
      }
    });

    document.getElementById('btn-mute').addEventListener('click', () => {
      const muted = this.audio.toggleMute();
      this.hud.updateMuteIcon(muted);
    });
  }

  handleResize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.camera.resize(this.canvas.width, this.canvas.height);
  }

  startRun(diffKey) {
    this.difficulty = DIFFICULTIES[diffKey] || DIFFICULTIES.normal;
    this.timeLeft = this.difficulty.timeLimit;
    this.elapsedTime = 0;
    this.stage = 1;
    this.cluesFound = 0;
    this.hideoutDiscovered = false;
    this.holdProgress = 0;
    this.holdTargetId = null;
    this.urgentWarned = false;
    this.atbWarned = false;
    this.needSuppliesWarned = false;

    const hideout = this.map.randomizeCityLayout();

    this.player = new Player(this.map.playerSpawn.x, this.map.playerSpawn.y);
    this.vasya = new Vasya(hideout.door.x, hideout.door.y - 24, this.difficulty);
    this.vasya.attachSystems({
      particles: this.particles,
      chat: this.chat,
      audio: this.audio,
    });

    this.pigs = createGuineaPigs(this.map.props.bushes, this.map.pigSpawns);
    this.enemies = new EnemySystem(this.difficulty);
    this.pickups = createWorldPickups(this.map);
    this.thrownItems = new ThrownItemManager();
    this.particles = new ParticleSystem();
    this.vasya.particles = this.particles;
    this.momCall.particles = this.particles;

    this.momCall.reset();
    this.chat.clear();
    this.screens.hideAll();
    this.hud.show();

    this.camera.snapTo(this.player.x, this.player.y);
    this.audio.startMusic('phase1');
    this.audio.playTrainHorn();

    const startLine = pickEventLine('start');
    if (startLine) this.chat.pushMessage(startLine.sender, startLine.text, 'normal');
    this.chat.pushMessage(
      'Олег',
      'Райони Галича перемішались! Можеш розпитати інформаторів (?) або сам стукати в двері хат [E].',
      'alert'
    );

    this.state = 'PLAYING';
  }

  update(dt) {
    this.globalTime += dt;

    if (this.state === 'BRIEFING') {
      const panX = 2800 + Math.sin(this.globalTime * 0.14) * 1800;
      const panY = 2300 + Math.cos(this.globalTime * 0.11) * 1400;
      this.camera.update(dt, panX, panY);
      this.audio.updateMusic(dt, 0.25, 'menu');
      this.input.endFrame();
      return;
    }

    if (this.state === 'INTRO') {
      this.audio.updateMusic(dt, 0.3, 'menu');
      this.input.endFrame();
      return;
    }

    // Smoke from train & grey checkmarks above active hideout once discovered
    this.smokeTimer += dt;
    if (this.smokeTimer >= 0.35) {
      this.smokeTimer = 0;
      const t = this.map.trainZone;
      this.particles.spawnParticle({
        x: t.x + 164 + (Math.random() * 10 - 5),
        y: t.y - 16,
        vx: -20 + Math.random() * 10,
        vy: -36,
        life: 1.8,
        size: 14,
        color: 'rgba(180, 175, 165, 0.4)',
      });
      if (this.hideoutDiscovered) {
        this.particles.spawnParticle({
          x: this.map.berlogaDoor.x + (Math.random() * 140 - 70),
          y: this.map.berlogaDoor.y - 90,
          vx: Math.random() * 16 - 8,
          vy: -26,
          life: 1.8,
          size: 17,
          color: '#9b9384',
          text: '✓',
        });
      }
    }

    if (this.state === 'ENDING') {
      this.particles.update(dt);
      if (this.endingType === 'secret') {
        this.secretFireworkTimer += dt;
        if (this.secretFireworkTimer > 0.7) {
          this.secretFireworkTimer = 0;
          this.particles.spawnCucumberFirework(
            this.camera.renderX + 200 + Math.random() * (this.camera.viewWidth - 400),
            this.camera.renderY + 150 + Math.random() * (this.camera.viewHeight - 300)
          );
        }
      }
      this.input.endFrame();
      return;
    }

    if (this.state !== 'PLAYING') {
      this.input.endFrame();
      return;
    }

    if (this.input.wasPressed('KeyM')) {
      const muted = this.audio.toggleMute();
      this.hud.updateMuteIcon(muted);
    }
    if (this.input.wasPressed('KeyC')) {
      this.momCall.trigger(this.vasya);
    }

    for (let i = 0; i < 4; i++) {
      if (this.input.wasPressed(`Digit${i + 1}`)) {
        this.player.selectedSlot = i;
      }
    }

    this.timeLeft -= dt;
    this.elapsedTime += dt;

    if (!this.urgentWarned && this.timeLeft <= 45) {
      this.urgentWarned = true;
      this.audio.playTrainHorn();
      const line = pickEventLine('urgentTime');
      if (line) this.chat.pushMessage(line.sender, line.text, 'alert');
    }

    if (this.timeLeft <= 0) {
      this.finishGame('defeat');
      this.input.endFrame();
      return;
    }

    this.player.update(dt, this.input, this.map, this.audio);

    if (!this.atbWarned && this.player.inQueue) {
      this.atbWarned = true;
      const line = pickEventLine('atbQueue');
      if (line) this.chat.pushMessage(line.sender, line.text, 'normal');
    }

    for (const p of this.pickups) {
      if (p.collected) continue;
      if (dist(this.player.x, this.player.y, p.x, p.y) < this.player.radius + p.radius + 8) {
        if (this.player.addItem(p.type)) {
          p.collected = true;
          this.audio.playTelegramPing();
          const meta = ITEM_TYPES[p.type];
          this.particles.spawnBurst(p.x, p.y, meta.color, 8, 70);
          this.particles.spawnSpeechBubble(this.player, `+${meta.icon}`, {
            bg: '#171614',
            fg: '#e59a24',
            duration: 1.0,
          });
        }
      }
    }

    if (this.input.wasPressed('KeyQ') || this.input.mouse.clicked) {
      const itemType = this.player.consumeSelected();
      if (itemType) {
        const targetX = this.input.mouse.clicked
          ? this.input.mouse.x + this.camera.renderX
          : this.stage === 3
            ? this.vasya.x
            : this.player.x + Math.cos(this.player.facingAngle) * 220;
        const targetY = this.input.mouse.clicked
          ? this.input.mouse.y + this.camera.renderY
          : this.stage === 3
            ? this.vasya.y
            : this.player.y + Math.sin(this.player.facingAngle) * 220;

        this.thrownItems.throwItem(itemType, this.player.x, this.player.y, targetX, targetY);
      }
    }

    this.thrownItems.update(dt, (type, lx, ly) => {
      if (type === 'meme' && (this.stage < 3 || dist(lx, ly, this.vasya.x, this.vasya.y) < 220)) {
        this.vasya.applyItem('meme', this.player);
      } else if (this.stage === 3 && dist(lx, ly, this.vasya.x, this.vasya.y) < 140) {
        this.vasya.applyItem(type, this.player);
      } else if (type === 'shaurma') {
        this.player.stamina = Math.min(this.player.maxStamina, this.player.stamina + 60);
        this.audio.playCrunch();
      } else if (type === 'beer') {
        this.audio.playBeerOpen();
        this.particles.spawnBurst(lx, ly, '#e59a24', 10, 80);
      } else if (type === 'cucumber') {
        for (const pig of this.pigs) {
          if (pig.state === 'SPOOKED' && dist(pig.x, pig.y, lx, ly) < 190) {
            pig.state = 'WILD';
          }
        }
      }
    });

    const escortPigs = this.pigs.filter((p) => p.state === 'ESCORT');
    const heldItem = this.player.getSelectedItem();
    const heldCucumber = heldItem && heldItem.type === 'cucumber';
    let followIdx = 0;
    for (const pig of this.pigs) {
      pig.update(dt, {
        player: this.player,
        vasya: this.vasya,
        followIndex: pig.state === 'ESCORT' ? followIdx++ : 0,
        cucumbers: this.thrownItems.cucumbersOnGround,
        heldCucumber,
        colliders: this.map.buildings,
        particles: this.particles,
        audio: this.audio,
      });
    }

    const promptText = this.handleInteractions(dt, escortPigs);

    this.vasya.update(dt, {
      player: this.player,
      escortPigsCount: escortPigs.length,
      colliders: this.map.buildings,
    });

    this.enemies.update(dt, {
      player: this.player,
      vasya: this.vasya,
      phase3: this.stage === 3,
      escortPigs,
      colliders: this.map.buildings,
      particles: this.particles,
      audio: this.audio,
      camera: this.camera,
      chat: this.chat,
    });

    this.momCall.update(dt, this.vasya);
    this.particles.update(dt);
    this.camera.update(dt, this.player.x, this.player.y);

    const tiltFactor = this.vasya.tilt / 100;
    const musicMode =
      this.timeLeft < 45 ? 'overdrive' : this.stage === 3 ? 'phase2' : 'phase1';
    const intensity = Math.min(1, tiltFactor * 0.7 + (this.stage === 3 ? 0.3 : 0));
    this.audio.updateMusic(dt, intensity, musicMode);

    if (this.vasya.heardPhrases.size >= ALL_UNIQUE_PHRASES.length) {
      this.achievements.unlock('filosof_vasylivky');
    }

    if (
      this.stage === 3 &&
      this.vasya.state !== 'IN_DEN' &&
      this.map.isInExtractionZone(this.vasya.x, this.vasya.y)
    ) {
      const finalEscortCount = this.pigs.filter((p) => p.state === 'ESCORT').length;
      const endingType = finalEscortCount >= 3 ? 'secret' : 'victory';
      this.finishGame(endingType, finalEscortCount);
      this.input.endFrame();
      return;
    }

    const targetPos = this.getCompassTarget();

    this.hud.update({
      timeLeft: this.timeLeft,
      stage: this.stage,
      cluesFound: this.cluesFound,
      player: this.player,
      vasya: this.vasya,
      escortCount: escortPigs.length,
      targetPos,
      zoneName: this.map.getZoneName(this.player.x, this.player.y),
      promptText,
      onSelectSlot: (idx) => {
        this.player.selectedSlot = idx;
      },
    });

    this.minimap.render({
      map: this.map,
      player: this.player,
      vasya: this.vasya,
      pigs: this.pigs,
      pickups: this.pickups,
      deadlines: this.enemies.deadlines,
      stage: this.stage,
      hideoutDiscovered: this.hideoutDiscovered,
      cluesFound: this.cluesFound,
    });

    this.input.endFrame();
  }

  getCompassTarget() {
    if (this.stage === 3) {
      return {
        x: this.map.extractionZone.x + this.map.extractionZone.w / 2,
        y: this.map.extractionZone.y + this.map.extractionZone.h / 2,
      };
    }
    if (this.hideoutDiscovered) {
      return this.map.berlogaDoor;
    }
    if (this.cluesFound >= 1) {
      const targetBlock = this.map.blocks.find((b) => b.id === this.map.activeHideout.blockId);
      if (targetBlock) {
        return { x: targetBlock.x + targetBlock.w / 2, y: targetBlock.y + targetBlock.h / 2 };
      }
    }
    let best = null;
    let bestD = Infinity;
    for (const inf of this.map.informants) {
      if (inf.questioned) continue;
      const d = dist(this.player.x, this.player.y, inf.x, inf.y);
      if (d < bestD) {
        bestD = d;
        best = inf;
      }
    }
    return best || this.map.berlogaDoor;
  }

  advanceHold(targetId, duration, dt) {
    if (this.holdTargetId !== targetId) {
      this.holdTargetId = targetId;
      this.holdProgress = 0;
    }
    if (this.input.isDown('KeyE')) {
      this.holdProgress += dt / duration;
      if (this.holdProgress >= 1) {
        this.holdProgress = 0;
        this.holdTargetId = null;
        return true;
      }
    } else {
      this.holdProgress = Math.max(0, this.holdProgress - dt * 1.6);
    }
    return false;
  }

  handleInteractions(dt, escortPigs) {
    // 1. Stage 1: Question Informants (?) for progressive clues
    if (this.stage === 1) {
      for (const inf of this.map.informants) {
        if (inf.questioned) continue;
        if (dist(this.player.x, this.player.y, inf.x, inf.y) < 88) {
          if (this.advanceHold(inf.id, 1.0, dt)) {
            inf.questioned = true;
            this.cluesFound += 1;
            this.audio.playRadioChirp();

            if (this.cluesFound === 1) {
              this.chat.pushMessage(
                inf.name,
                `Васю бачили у кварталі «${this.map.activeHideout.districtHint}»! Підсвітив район на радарі.`,
                'alert'
              );
            } else if (this.cluesFound === 2) {
              this.chat.pushMessage(
                inf.name,
                `Точно знаю — він зачинився в будівлі типу «${this.map.activeHideout.typeLabel}» у кварталі «${this.map.activeHideout.districtHint}»!`,
                'alert'
              );
            } else if (this.cluesFound >= 3) {
              this.stage = 2;
              this.hideoutDiscovered = true;
              this.chat.pushMessage(
                inf.name,
                `Точна адреса: ${this.map.activeHideout.buildingLabel} (${this.map.activeHideout.districtHint})! Мітка на радарі!`,
                'alert'
              );
              const foundLine = pickEventLine('hideoutLocated');
              if (foundLine) this.chat.pushMessage(foundLine.sender, foundLine.text, 'alert');
            }
          }
          const pct = Math.min(100, Math.round(this.holdProgress * 100));
          return pct > 0
            ? `РОЗПИТУЄМО (${inf.name})... ${pct}%`
            : `ЗАТИСНИ [E] — РОЗПИТАТИ: ${inf.name.toUpperCase()}`;
        }
      }

      // 1b. Knock on ANY searchable house door directly!
      for (const door of this.map.searchableDoors) {
        if (door.checked) continue;
        if (dist(this.player.x, this.player.y, door.x, door.y) < 76) {
          if (this.advanceHold(door.id, 0.7, dt)) {
            this.audio.playDoorKnock();
            if (door.isVasya) {
              this.stage = 2;
              this.hideoutDiscovered = true;
              this.audio.playRadioChirp();
              this.particles.spawnSpeechBubble(this.player, 'ТУТ ВАСЯ!', {
                bg: '#e59a24',
                fg: '#141311',
                duration: 2.0,
              });
              this.chat.pushMessage(
                'Олег',
                `НІЧОГО СОБІ! Ти сам натрапив на Берлогу Васі (${door.label})! Відчиняй двері!`,
                'alert'
              );
            } else {
              door.checked = true;
              const reply =
                EMPTY_HOUSE_REPLIES[Math.floor(Math.random() * EMPTY_HOUSE_REPLIES.length)];
              this.particles.spawnSpeechBubble(this.player, 'Пусто...', {
                bg: '#22201c',
                fg: '#d6b87c',
                duration: 1.4,
              });
              this.chat.pushMessage(door.label, reply, 'normal');

              // 30% chance resident gives a bonus item!
              if (Math.random() < 0.3) {
                const bonusPool = ['beer', 'shaurma', 'cucumber'];
                const bonus = bonusPool[Math.floor(Math.random() * bonusPool.length)];
                if (this.player.addItem(bonus)) {
                  const meta = ITEM_TYPES[bonus];
                  this.audio.playTelegramPing();
                  this.chat.pushMessage(
                    'Віталік',
                    `Мешканці підкинули тобі ${meta.icon} ${meta.name}!`,
                    'normal'
                  );
                }
              }
            }
          }
          const pct = Math.min(100, Math.round(this.holdProgress * 100));
          return pct > 0
            ? `СТУКАЄМО В «${door.label}»... ${pct}%`
            : `ЗАТИСНИ [E] — ПОСТУКАТИ В «${door.label}»`;
        }
      }
    }

    // 2. Stage 2: Open Vasya's discovered hideout (requires 1 Guinea Pig + Beer/Shaurma)
    if (this.stage === 2 && this.hideoutDiscovered) {
      const dDoor = dist(
        this.player.x,
        this.player.y,
        this.map.berlogaDoor.x,
        this.map.berlogaDoor.y
      );
      if (dDoor < 100) {
        const hasPig = escortPigs.length >= 1;
        const hasDrink = this.player.hasBeerOrShaurma();

        if (!hasPig || !hasDrink) {
          if (!this.needSuppliesWarned) {
            this.needSuppliesWarned = true;
            const line = pickEventLine('needSupplies');
            if (line) this.chat.pushMessage(line.sender, line.text, 'alert');
          }
          return 'ДВЕРІ ЗАЧИНЕНІ! ПРИВЕДИ СВИНКУ (🐹) ТА ВІЗЬМИ ПИВО/ШАУРМУ (🍺/🌯)';
        }

        if (this.advanceHold('open_berloga', 1.25, dt)) {
          this.stage = 3;
          this.vasya.state = 'FOLLOWING';
          this.vasya.x = this.map.berlogaDoor.x;
          this.vasya.y = this.map.berlogaDoor.y + 24;
          this.vasya.say('Да', { duration: 2.0 });
          this.audio.playTrainHorn();
          this.camera.shake(7, 0.22);
          const line = pickEventLine('vasyaFound');
          if (line) this.chat.pushMessage(line.sender, line.text, 'alert');
        }
        const pct = Math.min(100, Math.round(this.holdProgress * 100));
        return pct > 0
          ? `ВІДКРИВАЄМО БЕРЛОГУ... ${pct}%`
          : 'ЗАТИСНИ [E] — ВИТЯГТИ ВАСЮ З БЕРЛОГИ!';
      }
    }

    if (!this.input.isDown('KeyE')) {
      this.holdProgress = Math.max(0, this.holdProgress - dt * 1.6);
      if (this.holdProgress === 0) this.holdTargetId = null;
    }

    // 3. Stage 3: Vasya in COMA (tap E 5 times)
    if (this.stage === 3 && this.vasya.state === 'COMA') {
      const dVasya = dist(this.player.x, this.player.y, this.vasya.x, this.vasya.y);
      if (dVasya < 110) {
        if (this.input.wasPressed('KeyE')) {
          this.vasya.pressMoralSupport();
        }
        return `СПАМЬ [E] — МОРАЛЬНА ПІДТРИМКА (${this.vasya.comaPressCount}/5) АБО КИНЬ ПИВО [Q]`;
      }
    }

    // 4. Pick up nearby Guinea Pig (any stage, up to 3)
    if (escortPigs.length < 3) {
      for (const pig of this.pigs) {
        if (pig.state !== 'ESCORT' && dist(this.player.x, this.player.y, pig.x, pig.y) < 85) {
          if (this.input.wasPressed('KeyE')) {
            pig.calmAndFollow(this.particles, this.audio);
            const line = pickEventLine('pigPicked');
            if (line) this.chat.pushMessage(line.sender, line.text, 'normal');
            return null;
          }
          return 'НАТИСНИ [E] — ВЗЯТИ МОРСЬКУ СВИНКУ В ЗАГІН 🐹';
        }
      }
    }

    return null;
  }

  finishGame(type, pigsSaved = 0) {
    this.state = 'ENDING';
    this.endingType = type;
    this.audio.stopMusic();
    this.hud.hide();

    if (type === 'victory' || type === 'secret') {
      this.audio.playMomUlt();
      if (this.vasya.comaCountTotal === 0) {
        this.achievements.unlock('druzhba_narodiv');
      }
      if (pigsSaved >= 3) {
        this.achievements.unlock('svynko_ryativnyk');
      }
      if (this.elapsedTime < 90) {
        this.achievements.unlock('speedrun_galych');
      }
      if (type === 'secret') {
        this.particles.spawnCucumberFirework(this.vasya.x, this.vasya.y);
      }
    } else {
      this.audio.playTiltSiren();
    }

    if (this.vasya.comaCountTotal >= 3) {
      this.achievements.unlock('bratiky_ne_zavorkaly');
    }

    this.screens.showEnding({
      type,
      elapsed: this.elapsedTime,
      pigsSaved,
      comaCount: this.vasya.comaCountTotal,
      phrasesCount: this.vasya.heardPhrases.size,
      difficultyName: this.difficulty.name,
      onRetry: () => this.startRun(this.difficulty.id),
      onMenu: () => {
        this.state = 'BRIEFING';
        this.audio.startMusic('menu');
        this.screens.showBriefing();
      },
    });
  }

  render() {
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;

    if (this.state === 'BRIEFING') {
      this.mapRenderer.renderBase(ctx, this.camera, this.globalTime, {
        hideoutDiscovered: false,
        phase2: false,
        cluesFound: 0,
      });
      return;
    }

    if (this.state === 'INTRO') {
      ctx.fillStyle = '#141311';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      return;
    }

    this.mapRenderer.renderBase(ctx, this.camera, this.globalTime, {
      hideoutDiscovered: this.hideoutDiscovered,
      phase2: this.stage === 3,
      cluesFound: this.cluesFound,
    });
    this.enemies.render(ctx, this.camera, this.globalTime);
    this.thrownItems.render(ctx, this.camera, this.pickups, this.globalTime);

    for (const pig of this.pigs) {
      pig.render(ctx, this.camera);
    }

    this.vasya.render(ctx, this.camera, this.globalTime);
    this.player.render(ctx, this.camera);

    if (this.holdProgress > 0) {
      const sx = Math.round(this.player.x - this.camera.renderX);
      const sy = Math.round(this.player.y - 40 - this.camera.renderY);
      ctx.fillStyle = '#141311';
      ctx.fillRect(sx - 46, sy, 92, 12);
      ctx.fillStyle = '#e59a24';
      ctx.fillRect(sx - 44, sy + 2, 88 * Math.min(1, this.holdProgress), 8);
    }

    this.mapRenderer.renderLighting(
      ctx,
      this.camera,
      this.player,
      this.difficulty,
      this.stage === 3
    );
    this.particles.render(ctx, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
