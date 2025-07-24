import { noop } from '@/utils';
import defaultAvatar from '@/assets/img/avatars/default.svg';
import defaultLogo from '@/assets/img/logos/default.png';

export { defaultAvatar }
export { defaultLogo }


export const forceReloadWindow = () => {
    if (process.env.NODE_ENV === 'test') {
        return;
    }

    window.onbeforeunload = noop;
    window.location.reload();
}

export const copyText = async (text) => {
    try {
        await navigator.clipboard.writeText(text);
    } catch (error) {
        let copyArea = document.querySelector('#copyArea');

        if (!copyArea) {
            copyArea = document.createElement('textarea');
            copyArea.id = 'copyArea';
            document.body.appendChild(copyArea);
        }

        copyArea.style.top = `${window.scrollY || document.documentElement.scrollTop}px`;
        copyArea.value = text;
        select(copyArea);
        document.execCommand('copy');
    }
};