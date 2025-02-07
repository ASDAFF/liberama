<template>
    <div>
        <Dialog ref="dialog1" v-model="whatsNewVisible">
            <template #header>
                Что нового:
            </template>

            <div style="line-height: 20px" v-html="whatsNewContent"></div>

            <span class="clickable" @click="openVersionHistory">Посмотреть историю версий</span>
            <span slot="footer">
                <q-btn class="q-px-md" dense no-caps @click="whatsNewDisable">Больше не показывать</q-btn>
            </span>
        </Dialog>

        <Dialog ref="dialog2" v-model="donationVisible">
            <template #header>
                Здравствуйте, уважаемые читатели!
            </template>

            <div style="word-break: normal">
                Стартовала ежегодная акция "Оплатим хостинг вместе".<br><br>

                Для оплаты годового хостинга читалки, необходимо собрать около 2000 рублей.
                В настоящий момент у автора эта сумма есть в наличии. Однако будет справедливо, если каждый
                сможет проголосовать рублем за то, чтобы читалка так и оставалась:

                <ul>
                    <li>непрерывно улучшаемой</li>
                    <li>без рекламы</li>
                    <li>без регистрации</li>
                    <li>Open Source</li>
                </ul>

                Автор также обращается с просьбой о помощи в распространении 
                <a href="https://omnireader.ru" target="_blank">ссылки</a>
                <q-icon class="copy-icon" name="la la-copy" @click="copyLink('https://omnireader.ru')">
                    <q-tooltip :delay="1000" anchor="top middle" self="center middle" content-style="font-size: 80%">
                        Скопировать
                    </q-tooltip>                    
                </q-icon>
                на читалку через тематические форумы, соцсети, мессенджеры и пр.
                Чем нас больше, тем легче оставаться на плаву и тем больше мотивации у разработчика, чтобы продолжать работать над проектом.

                <br><br>
                Если соберется бóльшая сумма, то разработка децентрализованной библиотеки для свободного обмена книгами будет по возможности ускорена.
                <br><br>
                P.S. При необходимости можно воспользоваться подходящим обменником на <a href="https://www.bestchange.ru" target="_blank">bestchange.ru</a>

                <br><br>
                <div class="row justify-center">
                    <q-btn class="q-px-sm" color="primary" dense no-caps rounded @click="openDonate">
                        Помочь проекту
                    </q-btn>
                </div>
            </div>

            <span slot="footer">
                <span class="clickable row justify-end" style="font-size: 60%; color: grey" @click="donationDialogDisable">Больше не показывать</span>                        
                <br>
                <q-btn class="q-px-sm" dense no-caps @click="donationDialogRemind">Напомнить позже</q-btn>
            </span>
        </Dialog>
    </div>
</template>

<script>
//-----------------------------------------------------------------------------
import vueComponent from '../../vueComponent.js';

import Dialog from '../../share/Dialog.vue';
import * as utils from '../../../share/utils';
import {versionHistory} from '../versionHistory';

const componentOptions = {
    components: {
        Dialog
    },
    watch: {
        settings: function() {
            this.loadSettings();
        },
    },
};
class ReaderDialogs {
    _options = componentOptions;

    whatsNewVisible = false;
    whatsNewContent = '';
    donationVisible = false;

    created() {
        this.commit = this.$store.commit;
        this.loadSettings();
    }

    mounted() {
    }

    async init() {
        await this.showWhatsNew();
        await this.showDonation();
    }

    loadSettings() {
        const settings = this.settings;
        this.showWhatsNewDialog = settings.showWhatsNewDialog;
        this.showDonationDialog2020 = settings.showDonationDialog2020;
    }

    async showWhatsNew() {
        const whatsNew = versionHistory[0];
        if (this.showWhatsNewDialog &&
            whatsNew.showUntil >= utils.formatDate(new Date(), 'coDate') &&
            whatsNew.header != this.whatsNewContentHash) {
            await utils.sleep(2000);
            this.whatsNewContent = 'Версия ' + whatsNew.header + whatsNew.content;
            this.whatsNewVisible = true;
        }
    }

    async showDonation() {
        const today = utils.formatDate(new Date(), 'coDate');

        if ((this.mode == 'omnireader' || this.mode == 'liberama.top') && today < '2020-03-01' && this.showDonationDialog2020 && this.donationRemindDate != today) {
            await utils.sleep(3000);
            this.donationVisible = true;
        }
    }

    donationDialogDisable() {
        this.donationVisible = false;
        if (this.showDonationDialog2020) {
            this.commit('reader/setSettings', { showDonationDialog2020: false });
        }
    }

    donationDialogRemind() {
        this.donationVisible = false;
        this.commit('reader/setDonationRemindDate', utils.formatDate(new Date(), 'coDate'));
    }

    openDonate() {
        this.donationVisible = false;
        this.$emit('donate-toggle');
    }

    async copyLink(link) {
        const result = await utils.copyTextToClipboard(link);
        if (result)
            this.$root.notify.success(`Ссылка ${link} успешно скопирована в буфер обмена`);
        else
            this.$root.notify.error('Копирование не удалось');
    }

    openVersionHistory() {
        this.whatsNewVisible = false;
        this.$emit('version-history-toggle');
    }

    whatsNewDisable() {
        this.whatsNewVisible = false;
        const whatsNew = versionHistory[0];
        this.commit('reader/setWhatsNewContentHash', whatsNew.header);
    }

    get mode() {
        return this.$store.state.config.mode;
    }

    get settings() {
        return this.$store.state.reader.settings;
    }

    get whatsNewContentHash() {
        return this.$store.state.reader.whatsNewContentHash;
    }

    get donationRemindDate() {
        return this.$store.state.reader.donationRemindDate;
    }

    keyHook() {
        if (this.$refs.dialog1.active || this.$refs.dialog2.active)
            return true;
        return false;
    }
}

export default vueComponent(ReaderDialogs);
//-----------------------------------------------------------------------------
</script>

<style scoped>
.clickable {
    color: blue;
    text-decoration: underline;
    cursor: pointer;
}

.copy-icon {
    cursor: pointer;
    font-size: 120%;
    color: blue;
}
</style>
