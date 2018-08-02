import Styler from '../styler';

export default class Line {
  constructor (align) {
    this.$align = align;
    this.el = document.createElement('hr');
    this.el.classList.add('align-line');
    this._init();
  }

  static add (align) {
    return new Promise((resolve, reject) => {
      resolve(new Line(align));
    });
  }

  _init () {
    this.toolbar = new Styler(this.$align, Line.defaults);
    this.el.addEventListener('click', () => {
      this.toolbar.update(this);
    });
  }

  remove () {
    this.toolbar.remove();
    this.el.remove();
  }

  static defaults = {
    mode: 'bubble',
    hideWhenClickOut: true,
    commands: [
      {
        element: 'classes',
        values: ['normal', 'dashed', 'dotted', 'double', 'dots', 'thick']
      },
      'remove'
    ]
  }

  static schema = {
    icon: 'line',
    tooltip: 'Line separator'
  }
}

// addLine: {
//   element: 'dropdown',
//   items: [
//     '<hr class="align-line">',
//     '<hr class="align-line is-dashed">',
//     '<hr class="align-line is-dotted">',
//     '<hr class="align-line is-double">',
//     '<hr class="align-line is-dots">',
//     '<hr class="align-line is-bold">',
//     '<hr class="align-line is-bold is-dashed">',
//     '<hr class="align-line is-bold is-dotted">',
//     '<hr class="align-line is-bold is-double">'
//   ],
//   icon: 'insertLine',
//   func: 'addHTML',
//   tooltip: 'Add line'
// },