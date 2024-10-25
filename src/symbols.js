
export const ReadonlyInjectionKey = (type) => {
    return {
      type,
      closure: () => {}
    };
  };

export const RouterKey = Symbol('Router');
export const OverlayKey = Symbol('Overlay')
export const DialogBoxKey = Symbol('DialogBox')
export const MessageToasterKey = Symbol('MessageToaster')


export const ListConfigKey = Symbol('ListConfig');
export const ListSortFieldKey = Symbol('ListSortField');

export const ObjectsKey = Symbol('Objects')
export const CurrentSelectKey = Symbol('CurrentSelect')
export const SelectedObjectKey = Symbol('SelectedObject')

export const ListSortOrderKey = Symbol('ListSortOrder')
export const ListFilterKeywordsKey = Symbol('ListFilterKeywords')
export const ObjectListContextKey = Symbol('ObjectListContext')

export const ModalContextKey = Symbol('ModalContext')



