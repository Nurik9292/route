
export const ReadonlyInjectionKey = (type) => {
    return {
      type,
      closure: () => {}
    };
  };

export const RouterKey = Symbol('Router');
export const OverlayKey = Symbol('Overlay')
export const DialogBoxKey = Symbol('DialogBox')
export const MessageToasterKey = Symbol('MessageToaster');


export const StopsKey = Symbol('Stops');
export const CurrentStopKey = Symbol('CurrentStop');
export const SelectedStopsKey = Symbol('SelectedStopsKey');
export const StopListConfigKey = Symbol('StopListConfig');
export const StopListSortFieldKey = Symbol('StopListSortField');
export const StopListSortOrderKey = Symbol('StopListSortOrder');
export const StopListFilterKeywordsKey = Symbol('StopListFilterKeywords');
export const StopListContextKey = Symbol('StopListContext');

export const ModalContextKey = Symbol('ModalContext');


