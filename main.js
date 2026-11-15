/*
 * Reload Current File
 * Copyright (c) 2026 Unagi Tech Inc.
 * Released under the MIT License. See LICENSE.
 *
 * Re-reads the open note from disk when another program changes it.
 * Useful on network drives and sync folders, where Obsidian may not be
 * told about changes made outside the app.
 */
const { Plugin, PluginSettingTab, Setting, Notice, MarkdownView, moment } = require('obsidian');

const DEFAULT_SETTINGS = {
  autoReload: true,
  intervalSeconds: 3,
  showNotice: true,
};

const MIN_INTERVAL = 1;
const MAX_INTERVAL = 60;

const STRINGS = {
  en: {
    command: 'Reload current file from disk',
    noFile: 'No Markdown file is open.',
    unchanged: 'No changes on disk.',
    reloaded: 'Reloaded from disk.',
    autoReloaded: 'File changed on disk. Reloaded.',
    failed: 'Could not reload the file: ',
    autoName: 'Reload automatically',
    autoDesc: 'Check the open file for changes on disk and reload it when it changes.',
    intervalName: 'Check interval (seconds)',
    intervalDesc: `How often to check the open file. ${MIN_INTERVAL} to ${MAX_INTERVAL} seconds.`,
    noticeName: 'Show a notice after reloading',
    noticeDesc: 'Show a short message when the file is reloaded automatically.',
  },
  ja: {
    command: '開いているファイルをディスクから読み込み直す',
    noFile: 'Markdown のファイルが開いていません。',
    unchanged: '変わりはありませんでした。',
    reloaded: '読み込み直しました。',
    autoReloaded: 'ファイルが変更されたので、読み込み直しました。',
    failed: '読み込み直せませんでした：',
    autoName: '自動で読み込み直す',
    autoDesc: '開いているファイルを確認し、ディスクのファイルが変更されていたら読み込み直します。',
    intervalName: '確認する間隔（秒）',
    intervalDesc: `開いているファイルを確認する間隔です。${MIN_INTERVAL}〜${MAX_INTERVAL} 秒。`,
    noticeName: '読み込み直したら通知する',
    noticeDesc: '自動で読み込み直したときに、短い通知を表示します。',
  },
};

function t(key) {
  const locale = (moment && typeof moment.locale === 'function' ? moment.locale() : 'en') || 'en';
  const table = locale.startsWith('ja') ? STRINGS.ja : STRINGS.en;
  return table[key] !== undefined ? table[key] : STRINGS.en[key];
}

function clampInterval(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return DEFAULT_SETTINGS.intervalSeconds;
  return Math.min(MAX_INTERVAL, Math.max(MIN_INTERVAL, Math.round(n)));
}

module.exports = class ReloadCurrentFilePlugin extends Plugin {
  async onload() {
    await this.loadSettings();

    // Disk modification time last read or saved, per file path.
    this.seen = new Map();
    this.busy = false;
    this.timer = null;

    this.addCommand({
      id: 'reload',
      name: t('command'),
      callback: () => this.reloadActive(true),
    });

    // Remember Obsidian's own saves so they do not trigger a reload.
    this.registerEvent(
      this.app.vault.on('modify', file => {
        if (file && file.stat) this.seen.set(file.path, file.stat.mtime);
      }),
    );

    this.addSettingTab(new ReloadCurrentFileSettingTab(this.app, this));
    this.restartTimer();
  }

  onunload() {
    this.stopTimer();
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    this.settings.intervalSeconds = clampInterval(this.settings.intervalSeconds);
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.restartTimer();
  }

  stopTimer() {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
  }

  restartTimer() {
    this.stopTimer();
    if (!this.settings.autoReload) return;
    this.timer = window.setInterval(() => this.check(), this.settings.intervalSeconds * 1000);
    this.registerInterval(this.timer);
  }

  activeView() {
    return this.app.workspace.getActiveViewOfType(MarkdownView);
  }

  async check() {
    if (this.busy) return;
    const view = this.activeView();
    const file = view && view.file;
    if (!file) return;
    try {
      const stat = await this.app.vault.adapter.stat(file.path);
      if (!stat) return;
      const known = Math.max(this.seen.get(file.path) || 0, file.stat.mtime);
      if (stat.mtime > known + 1) await this.reloadActive(false);
    } catch (e) {
      // A failed check is retried on the next tick.
    }
  }

  async reloadActive(manual) {
    const view = this.activeView();
    const file = view && view.file;
    if (!file) {
      if (manual) new Notice(t('noFile'));
      return;
    }
    this.busy = true;
    try {
      const adapter = this.app.vault.adapter;
      const data = await adapter.read(file.path);
      const stat = await adapter.stat(file.path);
      if (stat) this.seen.set(file.path, stat.mtime);

      if (view.getViewData() === data) {
        if (manual) new Notice(t('unchanged'));
        return;
      }

      if (view.getMode() === 'source') {
        // Editing view: replace the text and keep the cursor and scroll position.
        const editor = view.editor;
        const cursor = editor.getCursor();
        const scroll = editor.getScrollInfo();
        editor.setValue(data);
        const line = Math.min(cursor.line, editor.lastLine());
        const ch = Math.min(cursor.ch, editor.getLine(line).length);
        editor.setCursor({ line, ch });
        editor.scrollTo(scroll.left, scroll.top);
      } else {
        // Reading view.
        view.setViewData(data, false);
        if (view.previewMode && typeof view.previewMode.rerender === 'function') {
          view.previewMode.rerender(true);
        }
      }

      if (manual) {
        new Notice(t('reloaded'));
      } else if (this.settings.showNotice) {
        new Notice(t('autoReloaded'));
      }
    } catch (e) {
      new Notice(t('failed') + (e && e.message ? e.message : String(e)));
    } finally {
      this.busy = false;
    }
  }
};

class ReloadCurrentFileSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName(t('autoName'))
      .setDesc(t('autoDesc'))
      .addToggle(toggle =>
        toggle.setValue(this.plugin.settings.autoReload).onChange(async value => {
          this.plugin.settings.autoReload = value;
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName(t('intervalName'))
      .setDesc(t('intervalDesc'))
      .addSlider(slider =>
        slider
          .setLimits(MIN_INTERVAL, MAX_INTERVAL, 1)
          .setValue(this.plugin.settings.intervalSeconds)
          .setDynamicTooltip()
          .onChange(async value => {
            this.plugin.settings.intervalSeconds = clampInterval(value);
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName(t('noticeName'))
      .setDesc(t('noticeDesc'))
      .addToggle(toggle =>
        toggle.setValue(this.plugin.settings.showNotice).onChange(async value => {
          this.plugin.settings.showNotice = value;
          await this.plugin.saveSettings();
        }),
      );
  }
}
