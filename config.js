(function () {
    window.TRAINER_CONFIG = {
        // Backend URL - can be overridden for different environments
        BACKEND_URL: 'https://watermelon.boto.education/scorm/test2',
        // BACKEND_URL: 'https://watermelon.boto.education/scorm/test',

        // Bot avatar override (uncomment one to use)
        BOT_AVATAR: './assets/avatar.jpg', // default
        // BOT_AVATAR: './assets/vyacheslav_avatar.png',
        // BOT_AVATAR: './assets/darina_avatar.png',

        // UI flags
        SHOW_INTRO_CARD: false, // Показывать вводную карточку перед кнопкой старта
        DEEP_LINK_TOKEN: "",

        // SCORM Parameters
        DEBUG: true,
        SCORM_VERSION: '1.2',    // '1.2' for SCORM 1.2, '2004' for SCORM 2004 (3rd/4th Ed.)
        PASSING_SCORE: 70,
        MAX_SCORE: 100,
        MIN_SCORE: 0,
    };

    console.log('[TRAINER] Configuration loaded:', window.TRAINER_CONFIG);
})();
