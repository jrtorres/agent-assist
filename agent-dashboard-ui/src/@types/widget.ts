import * as t from "io-ts";

export const Widget = t.interface({
  type: t.string,
  minColumns: t.number
});

export const WidgetConfig = t.interface({
  widgets: t.array(Widget)
});

export type WidgetConfigT = t.TypeOf<typeof WidgetConfig>; // compile-time type