
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop$1() { }
    const identity$2 = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop$1;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop$1;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    // unfortunately this can't be a constant as that wouldn't be tree-shakeable
    // so we cache the result instead
    let crossorigin;
    function is_crossorigin() {
        if (crossorigin === undefined) {
            crossorigin = false;
            try {
                if (typeof window !== 'undefined' && window.parent) {
                    void window.parent.document;
                }
            }
            catch (error) {
                crossorigin = true;
            }
        }
        return crossorigin;
    }
    function add_resize_listener(node, fn) {
        const computed_style = getComputedStyle(node);
        if (computed_style.position === 'static') {
            node.style.position = 'relative';
        }
        const iframe = element('iframe');
        iframe.setAttribute('style', 'display: block; position: absolute; top: 0; left: 0; width: 100%; height: 100%; ' +
            'overflow: hidden; border: 0; opacity: 0; pointer-events: none; z-index: -1;');
        iframe.setAttribute('aria-hidden', 'true');
        iframe.tabIndex = -1;
        const crossorigin = is_crossorigin();
        let unsubscribe;
        if (crossorigin) {
            iframe.src = "data:text/html,<script>onresize=function(){parent.postMessage(0,'*')}</script>";
            unsubscribe = listen(window, 'message', (event) => {
                if (event.source === iframe.contentWindow)
                    fn();
            });
        }
        else {
            iframe.src = 'about:blank';
            iframe.onload = () => {
                unsubscribe = listen(iframe.contentWindow, 'resize', fn);
            };
        }
        append(node, iframe);
        return () => {
            if (crossorigin) {
                unsubscribe();
            }
            else if (unsubscribe && iframe.contentWindow) {
                unsubscribe();
            }
            detach(iframe);
        };
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch$1(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity$2, tick = noop$1, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program || pending_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch$1(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch$1(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch$1(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop$1,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop$1;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.37.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    function ascending(a, b) {
      return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
    }

    function bisector(f) {
      let delta = f;
      let compare = f;

      if (f.length === 1) {
        delta = (d, x) => f(d) - x;
        compare = ascendingComparator(f);
      }

      function left(a, x, lo, hi) {
        if (lo == null) lo = 0;
        if (hi == null) hi = a.length;
        while (lo < hi) {
          const mid = (lo + hi) >>> 1;
          if (compare(a[mid], x) < 0) lo = mid + 1;
          else hi = mid;
        }
        return lo;
      }

      function right(a, x, lo, hi) {
        if (lo == null) lo = 0;
        if (hi == null) hi = a.length;
        while (lo < hi) {
          const mid = (lo + hi) >>> 1;
          if (compare(a[mid], x) > 0) hi = mid;
          else lo = mid + 1;
        }
        return lo;
      }

      function center(a, x, lo, hi) {
        if (lo == null) lo = 0;
        if (hi == null) hi = a.length;
        const i = left(a, x, lo, hi - 1);
        return i > lo && delta(a[i - 1], x) > -delta(a[i], x) ? i - 1 : i;
      }

      return {left, center, right};
    }

    function ascendingComparator(f) {
      return (d, x) => ascending(f(d), x);
    }

    function number$1(x) {
      return x === null ? NaN : +x;
    }

    const ascendingBisect = bisector(ascending);
    const bisectRight = ascendingBisect.right;
    bisector(number$1).center;

    var e10 = Math.sqrt(50),
        e5 = Math.sqrt(10),
        e2 = Math.sqrt(2);

    function ticks(start, stop, count) {
      var reverse,
          i = -1,
          n,
          ticks,
          step;

      stop = +stop, start = +start, count = +count;
      if (start === stop && count > 0) return [start];
      if (reverse = stop < start) n = start, start = stop, stop = n;
      if ((step = tickIncrement(start, stop, count)) === 0 || !isFinite(step)) return [];

      if (step > 0) {
        let r0 = Math.round(start / step), r1 = Math.round(stop / step);
        if (r0 * step < start) ++r0;
        if (r1 * step > stop) --r1;
        ticks = new Array(n = r1 - r0 + 1);
        while (++i < n) ticks[i] = (r0 + i) * step;
      } else {
        step = -step;
        let r0 = Math.round(start * step), r1 = Math.round(stop * step);
        if (r0 / step < start) ++r0;
        if (r1 / step > stop) --r1;
        ticks = new Array(n = r1 - r0 + 1);
        while (++i < n) ticks[i] = (r0 + i) / step;
      }

      if (reverse) ticks.reverse();

      return ticks;
    }

    function tickIncrement(start, stop, count) {
      var step = (stop - start) / Math.max(0, count),
          power = Math.floor(Math.log(step) / Math.LN10),
          error = step / Math.pow(10, power);
      return power >= 0
          ? (error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1) * Math.pow(10, power)
          : -Math.pow(10, -power) / (error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1);
    }

    function tickStep(start, stop, count) {
      var step0 = Math.abs(stop - start) / Math.max(0, count),
          step1 = Math.pow(10, Math.floor(Math.log(step0) / Math.LN10)),
          error = step0 / step1;
      if (error >= e10) step1 *= 10;
      else if (error >= e5) step1 *= 5;
      else if (error >= e2) step1 *= 2;
      return stop < start ? -step1 : step1;
    }

    var noop = {value: () => {}};

    function dispatch() {
      for (var i = 0, n = arguments.length, _ = {}, t; i < n; ++i) {
        if (!(t = arguments[i] + "") || (t in _) || /[\s.]/.test(t)) throw new Error("illegal type: " + t);
        _[t] = [];
      }
      return new Dispatch(_);
    }

    function Dispatch(_) {
      this._ = _;
    }

    function parseTypenames(typenames, types) {
      return typenames.trim().split(/^|\s+/).map(function(t) {
        var name = "", i = t.indexOf(".");
        if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
        if (t && !types.hasOwnProperty(t)) throw new Error("unknown type: " + t);
        return {type: t, name: name};
      });
    }

    Dispatch.prototype = dispatch.prototype = {
      constructor: Dispatch,
      on: function(typename, callback) {
        var _ = this._,
            T = parseTypenames(typename + "", _),
            t,
            i = -1,
            n = T.length;

        // If no callback was specified, return the callback of the given type and name.
        if (arguments.length < 2) {
          while (++i < n) if ((t = (typename = T[i]).type) && (t = get(_[t], typename.name))) return t;
          return;
        }

        // If a type was specified, set the callback for the given type and name.
        // Otherwise, if a null callback was specified, remove callbacks of the given name.
        if (callback != null && typeof callback !== "function") throw new Error("invalid callback: " + callback);
        while (++i < n) {
          if (t = (typename = T[i]).type) _[t] = set(_[t], typename.name, callback);
          else if (callback == null) for (t in _) _[t] = set(_[t], typename.name, null);
        }

        return this;
      },
      copy: function() {
        var copy = {}, _ = this._;
        for (var t in _) copy[t] = _[t].slice();
        return new Dispatch(copy);
      },
      call: function(type, that) {
        if ((n = arguments.length - 2) > 0) for (var args = new Array(n), i = 0, n, t; i < n; ++i) args[i] = arguments[i + 2];
        if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
        for (t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
      },
      apply: function(type, that, args) {
        if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
        for (var t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
      }
    };

    function get(type, name) {
      for (var i = 0, n = type.length, c; i < n; ++i) {
        if ((c = type[i]).name === name) {
          return c.value;
        }
      }
    }

    function set(type, name, callback) {
      for (var i = 0, n = type.length; i < n; ++i) {
        if (type[i].name === name) {
          type[i] = noop, type = type.slice(0, i).concat(type.slice(i + 1));
          break;
        }
      }
      if (callback != null) type.push({name: name, value: callback});
      return type;
    }

    function define(constructor, factory, prototype) {
      constructor.prototype = factory.prototype = prototype;
      prototype.constructor = constructor;
    }

    function extend(parent, definition) {
      var prototype = Object.create(parent.prototype);
      for (var key in definition) prototype[key] = definition[key];
      return prototype;
    }

    function Color() {}

    var darker = 0.7;
    var brighter = 1 / darker;

    var reI = "\\s*([+-]?\\d+)\\s*",
        reN = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)\\s*",
        reP = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)%\\s*",
        reHex = /^#([0-9a-f]{3,8})$/,
        reRgbInteger = new RegExp("^rgb\\(" + [reI, reI, reI] + "\\)$"),
        reRgbPercent = new RegExp("^rgb\\(" + [reP, reP, reP] + "\\)$"),
        reRgbaInteger = new RegExp("^rgba\\(" + [reI, reI, reI, reN] + "\\)$"),
        reRgbaPercent = new RegExp("^rgba\\(" + [reP, reP, reP, reN] + "\\)$"),
        reHslPercent = new RegExp("^hsl\\(" + [reN, reP, reP] + "\\)$"),
        reHslaPercent = new RegExp("^hsla\\(" + [reN, reP, reP, reN] + "\\)$");

    var named = {
      aliceblue: 0xf0f8ff,
      antiquewhite: 0xfaebd7,
      aqua: 0x00ffff,
      aquamarine: 0x7fffd4,
      azure: 0xf0ffff,
      beige: 0xf5f5dc,
      bisque: 0xffe4c4,
      black: 0x000000,
      blanchedalmond: 0xffebcd,
      blue: 0x0000ff,
      blueviolet: 0x8a2be2,
      brown: 0xa52a2a,
      burlywood: 0xdeb887,
      cadetblue: 0x5f9ea0,
      chartreuse: 0x7fff00,
      chocolate: 0xd2691e,
      coral: 0xff7f50,
      cornflowerblue: 0x6495ed,
      cornsilk: 0xfff8dc,
      crimson: 0xdc143c,
      cyan: 0x00ffff,
      darkblue: 0x00008b,
      darkcyan: 0x008b8b,
      darkgoldenrod: 0xb8860b,
      darkgray: 0xa9a9a9,
      darkgreen: 0x006400,
      darkgrey: 0xa9a9a9,
      darkkhaki: 0xbdb76b,
      darkmagenta: 0x8b008b,
      darkolivegreen: 0x556b2f,
      darkorange: 0xff8c00,
      darkorchid: 0x9932cc,
      darkred: 0x8b0000,
      darksalmon: 0xe9967a,
      darkseagreen: 0x8fbc8f,
      darkslateblue: 0x483d8b,
      darkslategray: 0x2f4f4f,
      darkslategrey: 0x2f4f4f,
      darkturquoise: 0x00ced1,
      darkviolet: 0x9400d3,
      deeppink: 0xff1493,
      deepskyblue: 0x00bfff,
      dimgray: 0x696969,
      dimgrey: 0x696969,
      dodgerblue: 0x1e90ff,
      firebrick: 0xb22222,
      floralwhite: 0xfffaf0,
      forestgreen: 0x228b22,
      fuchsia: 0xff00ff,
      gainsboro: 0xdcdcdc,
      ghostwhite: 0xf8f8ff,
      gold: 0xffd700,
      goldenrod: 0xdaa520,
      gray: 0x808080,
      green: 0x008000,
      greenyellow: 0xadff2f,
      grey: 0x808080,
      honeydew: 0xf0fff0,
      hotpink: 0xff69b4,
      indianred: 0xcd5c5c,
      indigo: 0x4b0082,
      ivory: 0xfffff0,
      khaki: 0xf0e68c,
      lavender: 0xe6e6fa,
      lavenderblush: 0xfff0f5,
      lawngreen: 0x7cfc00,
      lemonchiffon: 0xfffacd,
      lightblue: 0xadd8e6,
      lightcoral: 0xf08080,
      lightcyan: 0xe0ffff,
      lightgoldenrodyellow: 0xfafad2,
      lightgray: 0xd3d3d3,
      lightgreen: 0x90ee90,
      lightgrey: 0xd3d3d3,
      lightpink: 0xffb6c1,
      lightsalmon: 0xffa07a,
      lightseagreen: 0x20b2aa,
      lightskyblue: 0x87cefa,
      lightslategray: 0x778899,
      lightslategrey: 0x778899,
      lightsteelblue: 0xb0c4de,
      lightyellow: 0xffffe0,
      lime: 0x00ff00,
      limegreen: 0x32cd32,
      linen: 0xfaf0e6,
      magenta: 0xff00ff,
      maroon: 0x800000,
      mediumaquamarine: 0x66cdaa,
      mediumblue: 0x0000cd,
      mediumorchid: 0xba55d3,
      mediumpurple: 0x9370db,
      mediumseagreen: 0x3cb371,
      mediumslateblue: 0x7b68ee,
      mediumspringgreen: 0x00fa9a,
      mediumturquoise: 0x48d1cc,
      mediumvioletred: 0xc71585,
      midnightblue: 0x191970,
      mintcream: 0xf5fffa,
      mistyrose: 0xffe4e1,
      moccasin: 0xffe4b5,
      navajowhite: 0xffdead,
      navy: 0x000080,
      oldlace: 0xfdf5e6,
      olive: 0x808000,
      olivedrab: 0x6b8e23,
      orange: 0xffa500,
      orangered: 0xff4500,
      orchid: 0xda70d6,
      palegoldenrod: 0xeee8aa,
      palegreen: 0x98fb98,
      paleturquoise: 0xafeeee,
      palevioletred: 0xdb7093,
      papayawhip: 0xffefd5,
      peachpuff: 0xffdab9,
      peru: 0xcd853f,
      pink: 0xffc0cb,
      plum: 0xdda0dd,
      powderblue: 0xb0e0e6,
      purple: 0x800080,
      rebeccapurple: 0x663399,
      red: 0xff0000,
      rosybrown: 0xbc8f8f,
      royalblue: 0x4169e1,
      saddlebrown: 0x8b4513,
      salmon: 0xfa8072,
      sandybrown: 0xf4a460,
      seagreen: 0x2e8b57,
      seashell: 0xfff5ee,
      sienna: 0xa0522d,
      silver: 0xc0c0c0,
      skyblue: 0x87ceeb,
      slateblue: 0x6a5acd,
      slategray: 0x708090,
      slategrey: 0x708090,
      snow: 0xfffafa,
      springgreen: 0x00ff7f,
      steelblue: 0x4682b4,
      tan: 0xd2b48c,
      teal: 0x008080,
      thistle: 0xd8bfd8,
      tomato: 0xff6347,
      turquoise: 0x40e0d0,
      violet: 0xee82ee,
      wheat: 0xf5deb3,
      white: 0xffffff,
      whitesmoke: 0xf5f5f5,
      yellow: 0xffff00,
      yellowgreen: 0x9acd32
    };

    define(Color, color, {
      copy: function(channels) {
        return Object.assign(new this.constructor, this, channels);
      },
      displayable: function() {
        return this.rgb().displayable();
      },
      hex: color_formatHex, // Deprecated! Use color.formatHex.
      formatHex: color_formatHex,
      formatHsl: color_formatHsl,
      formatRgb: color_formatRgb,
      toString: color_formatRgb
    });

    function color_formatHex() {
      return this.rgb().formatHex();
    }

    function color_formatHsl() {
      return hslConvert(this).formatHsl();
    }

    function color_formatRgb() {
      return this.rgb().formatRgb();
    }

    function color(format) {
      var m, l;
      format = (format + "").trim().toLowerCase();
      return (m = reHex.exec(format)) ? (l = m[1].length, m = parseInt(m[1], 16), l === 6 ? rgbn(m) // #ff0000
          : l === 3 ? new Rgb((m >> 8 & 0xf) | (m >> 4 & 0xf0), (m >> 4 & 0xf) | (m & 0xf0), ((m & 0xf) << 4) | (m & 0xf), 1) // #f00
          : l === 8 ? rgba(m >> 24 & 0xff, m >> 16 & 0xff, m >> 8 & 0xff, (m & 0xff) / 0xff) // #ff000000
          : l === 4 ? rgba((m >> 12 & 0xf) | (m >> 8 & 0xf0), (m >> 8 & 0xf) | (m >> 4 & 0xf0), (m >> 4 & 0xf) | (m & 0xf0), (((m & 0xf) << 4) | (m & 0xf)) / 0xff) // #f000
          : null) // invalid hex
          : (m = reRgbInteger.exec(format)) ? new Rgb(m[1], m[2], m[3], 1) // rgb(255, 0, 0)
          : (m = reRgbPercent.exec(format)) ? new Rgb(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, 1) // rgb(100%, 0%, 0%)
          : (m = reRgbaInteger.exec(format)) ? rgba(m[1], m[2], m[3], m[4]) // rgba(255, 0, 0, 1)
          : (m = reRgbaPercent.exec(format)) ? rgba(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, m[4]) // rgb(100%, 0%, 0%, 1)
          : (m = reHslPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, 1) // hsl(120, 50%, 50%)
          : (m = reHslaPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, m[4]) // hsla(120, 50%, 50%, 1)
          : named.hasOwnProperty(format) ? rgbn(named[format]) // eslint-disable-line no-prototype-builtins
          : format === "transparent" ? new Rgb(NaN, NaN, NaN, 0)
          : null;
    }

    function rgbn(n) {
      return new Rgb(n >> 16 & 0xff, n >> 8 & 0xff, n & 0xff, 1);
    }

    function rgba(r, g, b, a) {
      if (a <= 0) r = g = b = NaN;
      return new Rgb(r, g, b, a);
    }

    function rgbConvert(o) {
      if (!(o instanceof Color)) o = color(o);
      if (!o) return new Rgb;
      o = o.rgb();
      return new Rgb(o.r, o.g, o.b, o.opacity);
    }

    function rgb(r, g, b, opacity) {
      return arguments.length === 1 ? rgbConvert(r) : new Rgb(r, g, b, opacity == null ? 1 : opacity);
    }

    function Rgb(r, g, b, opacity) {
      this.r = +r;
      this.g = +g;
      this.b = +b;
      this.opacity = +opacity;
    }

    define(Rgb, rgb, extend(Color, {
      brighter: function(k) {
        k = k == null ? brighter : Math.pow(brighter, k);
        return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
      },
      darker: function(k) {
        k = k == null ? darker : Math.pow(darker, k);
        return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
      },
      rgb: function() {
        return this;
      },
      displayable: function() {
        return (-0.5 <= this.r && this.r < 255.5)
            && (-0.5 <= this.g && this.g < 255.5)
            && (-0.5 <= this.b && this.b < 255.5)
            && (0 <= this.opacity && this.opacity <= 1);
      },
      hex: rgb_formatHex, // Deprecated! Use color.formatHex.
      formatHex: rgb_formatHex,
      formatRgb: rgb_formatRgb,
      toString: rgb_formatRgb
    }));

    function rgb_formatHex() {
      return "#" + hex(this.r) + hex(this.g) + hex(this.b);
    }

    function rgb_formatRgb() {
      var a = this.opacity; a = isNaN(a) ? 1 : Math.max(0, Math.min(1, a));
      return (a === 1 ? "rgb(" : "rgba(")
          + Math.max(0, Math.min(255, Math.round(this.r) || 0)) + ", "
          + Math.max(0, Math.min(255, Math.round(this.g) || 0)) + ", "
          + Math.max(0, Math.min(255, Math.round(this.b) || 0))
          + (a === 1 ? ")" : ", " + a + ")");
    }

    function hex(value) {
      value = Math.max(0, Math.min(255, Math.round(value) || 0));
      return (value < 16 ? "0" : "") + value.toString(16);
    }

    function hsla(h, s, l, a) {
      if (a <= 0) h = s = l = NaN;
      else if (l <= 0 || l >= 1) h = s = NaN;
      else if (s <= 0) h = NaN;
      return new Hsl(h, s, l, a);
    }

    function hslConvert(o) {
      if (o instanceof Hsl) return new Hsl(o.h, o.s, o.l, o.opacity);
      if (!(o instanceof Color)) o = color(o);
      if (!o) return new Hsl;
      if (o instanceof Hsl) return o;
      o = o.rgb();
      var r = o.r / 255,
          g = o.g / 255,
          b = o.b / 255,
          min = Math.min(r, g, b),
          max = Math.max(r, g, b),
          h = NaN,
          s = max - min,
          l = (max + min) / 2;
      if (s) {
        if (r === max) h = (g - b) / s + (g < b) * 6;
        else if (g === max) h = (b - r) / s + 2;
        else h = (r - g) / s + 4;
        s /= l < 0.5 ? max + min : 2 - max - min;
        h *= 60;
      } else {
        s = l > 0 && l < 1 ? 0 : h;
      }
      return new Hsl(h, s, l, o.opacity);
    }

    function hsl(h, s, l, opacity) {
      return arguments.length === 1 ? hslConvert(h) : new Hsl(h, s, l, opacity == null ? 1 : opacity);
    }

    function Hsl(h, s, l, opacity) {
      this.h = +h;
      this.s = +s;
      this.l = +l;
      this.opacity = +opacity;
    }

    define(Hsl, hsl, extend(Color, {
      brighter: function(k) {
        k = k == null ? brighter : Math.pow(brighter, k);
        return new Hsl(this.h, this.s, this.l * k, this.opacity);
      },
      darker: function(k) {
        k = k == null ? darker : Math.pow(darker, k);
        return new Hsl(this.h, this.s, this.l * k, this.opacity);
      },
      rgb: function() {
        var h = this.h % 360 + (this.h < 0) * 360,
            s = isNaN(h) || isNaN(this.s) ? 0 : this.s,
            l = this.l,
            m2 = l + (l < 0.5 ? l : 1 - l) * s,
            m1 = 2 * l - m2;
        return new Rgb(
          hsl2rgb(h >= 240 ? h - 240 : h + 120, m1, m2),
          hsl2rgb(h, m1, m2),
          hsl2rgb(h < 120 ? h + 240 : h - 120, m1, m2),
          this.opacity
        );
      },
      displayable: function() {
        return (0 <= this.s && this.s <= 1 || isNaN(this.s))
            && (0 <= this.l && this.l <= 1)
            && (0 <= this.opacity && this.opacity <= 1);
      },
      formatHsl: function() {
        var a = this.opacity; a = isNaN(a) ? 1 : Math.max(0, Math.min(1, a));
        return (a === 1 ? "hsl(" : "hsla(")
            + (this.h || 0) + ", "
            + (this.s || 0) * 100 + "%, "
            + (this.l || 0) * 100 + "%"
            + (a === 1 ? ")" : ", " + a + ")");
      }
    }));

    /* From FvD 13.37, CSS Color Module Level 3 */
    function hsl2rgb(h, m1, m2) {
      return (h < 60 ? m1 + (m2 - m1) * h / 60
          : h < 180 ? m2
          : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60
          : m1) * 255;
    }

    var constant = x => () => x;

    function linear$1(a, d) {
      return function(t) {
        return a + t * d;
      };
    }

    function exponential(a, b, y) {
      return a = Math.pow(a, y), b = Math.pow(b, y) - a, y = 1 / y, function(t) {
        return Math.pow(a + t * b, y);
      };
    }

    function gamma(y) {
      return (y = +y) === 1 ? nogamma : function(a, b) {
        return b - a ? exponential(a, b, y) : constant(isNaN(a) ? b : a);
      };
    }

    function nogamma(a, b) {
      var d = b - a;
      return d ? linear$1(a, d) : constant(isNaN(a) ? b : a);
    }

    var interpolateRgb = (function rgbGamma(y) {
      var color = gamma(y);

      function rgb$1(start, end) {
        var r = color((start = rgb(start)).r, (end = rgb(end)).r),
            g = color(start.g, end.g),
            b = color(start.b, end.b),
            opacity = nogamma(start.opacity, end.opacity);
        return function(t) {
          start.r = r(t);
          start.g = g(t);
          start.b = b(t);
          start.opacity = opacity(t);
          return start + "";
        };
      }

      rgb$1.gamma = rgbGamma;

      return rgb$1;
    })(1);

    function numberArray(a, b) {
      if (!b) b = [];
      var n = a ? Math.min(b.length, a.length) : 0,
          c = b.slice(),
          i;
      return function(t) {
        for (i = 0; i < n; ++i) c[i] = a[i] * (1 - t) + b[i] * t;
        return c;
      };
    }

    function isNumberArray(x) {
      return ArrayBuffer.isView(x) && !(x instanceof DataView);
    }

    function genericArray(a, b) {
      var nb = b ? b.length : 0,
          na = a ? Math.min(nb, a.length) : 0,
          x = new Array(na),
          c = new Array(nb),
          i;

      for (i = 0; i < na; ++i) x[i] = interpolate(a[i], b[i]);
      for (; i < nb; ++i) c[i] = b[i];

      return function(t) {
        for (i = 0; i < na; ++i) c[i] = x[i](t);
        return c;
      };
    }

    function date(a, b) {
      var d = new Date;
      return a = +a, b = +b, function(t) {
        return d.setTime(a * (1 - t) + b * t), d;
      };
    }

    function interpolateNumber(a, b) {
      return a = +a, b = +b, function(t) {
        return a * (1 - t) + b * t;
      };
    }

    function object(a, b) {
      var i = {},
          c = {},
          k;

      if (a === null || typeof a !== "object") a = {};
      if (b === null || typeof b !== "object") b = {};

      for (k in b) {
        if (k in a) {
          i[k] = interpolate(a[k], b[k]);
        } else {
          c[k] = b[k];
        }
      }

      return function(t) {
        for (k in i) c[k] = i[k](t);
        return c;
      };
    }

    var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g,
        reB = new RegExp(reA.source, "g");

    function zero(b) {
      return function() {
        return b;
      };
    }

    function one(b) {
      return function(t) {
        return b(t) + "";
      };
    }

    function interpolateString(a, b) {
      var bi = reA.lastIndex = reB.lastIndex = 0, // scan index for next number in b
          am, // current match in a
          bm, // current match in b
          bs, // string preceding current number in b, if any
          i = -1, // index in s
          s = [], // string constants and placeholders
          q = []; // number interpolators

      // Coerce inputs to strings.
      a = a + "", b = b + "";

      // Interpolate pairs of numbers in a & b.
      while ((am = reA.exec(a))
          && (bm = reB.exec(b))) {
        if ((bs = bm.index) > bi) { // a string precedes the next number in b
          bs = b.slice(bi, bs);
          if (s[i]) s[i] += bs; // coalesce with previous string
          else s[++i] = bs;
        }
        if ((am = am[0]) === (bm = bm[0])) { // numbers in a & b match
          if (s[i]) s[i] += bm; // coalesce with previous string
          else s[++i] = bm;
        } else { // interpolate non-matching numbers
          s[++i] = null;
          q.push({i: i, x: interpolateNumber(am, bm)});
        }
        bi = reB.lastIndex;
      }

      // Add remains of b.
      if (bi < b.length) {
        bs = b.slice(bi);
        if (s[i]) s[i] += bs; // coalesce with previous string
        else s[++i] = bs;
      }

      // Special optimization for only a single match.
      // Otherwise, interpolate each of the numbers and rejoin the string.
      return s.length < 2 ? (q[0]
          ? one(q[0].x)
          : zero(b))
          : (b = q.length, function(t) {
              for (var i = 0, o; i < b; ++i) s[(o = q[i]).i] = o.x(t);
              return s.join("");
            });
    }

    function interpolate(a, b) {
      var t = typeof b, c;
      return b == null || t === "boolean" ? constant(b)
          : (t === "number" ? interpolateNumber
          : t === "string" ? ((c = color(b)) ? (b = c, interpolateRgb) : interpolateString)
          : b instanceof color ? interpolateRgb
          : b instanceof Date ? date
          : isNumberArray(b) ? numberArray
          : Array.isArray(b) ? genericArray
          : typeof b.valueOf !== "function" && typeof b.toString !== "function" || isNaN(b) ? object
          : interpolateNumber)(a, b);
    }

    function interpolateRound(a, b) {
      return a = +a, b = +b, function(t) {
        return Math.round(a * (1 - t) + b * t);
      };
    }

    dispatch("start", "end", "cancel", "interrupt");

    function formatDecimal(x) {
      return Math.abs(x = Math.round(x)) >= 1e21
          ? x.toLocaleString("en").replace(/,/g, "")
          : x.toString(10);
    }

    // Computes the decimal coefficient and exponent of the specified number x with
    // significant digits p, where x is positive and p is in [1, 21] or undefined.
    // For example, formatDecimalParts(1.23) returns ["123", 0].
    function formatDecimalParts(x, p) {
      if ((i = (x = p ? x.toExponential(p - 1) : x.toExponential()).indexOf("e")) < 0) return null; // NaN, ±Infinity
      var i, coefficient = x.slice(0, i);

      // The string returned by toExponential either has the form \d\.\d+e[-+]\d+
      // (e.g., 1.2e+3) or the form \de[-+]\d+ (e.g., 1e+3).
      return [
        coefficient.length > 1 ? coefficient[0] + coefficient.slice(2) : coefficient,
        +x.slice(i + 1)
      ];
    }

    function exponent(x) {
      return x = formatDecimalParts(Math.abs(x)), x ? x[1] : NaN;
    }

    function formatGroup(grouping, thousands) {
      return function(value, width) {
        var i = value.length,
            t = [],
            j = 0,
            g = grouping[0],
            length = 0;

        while (i > 0 && g > 0) {
          if (length + g + 1 > width) g = Math.max(1, width - length);
          t.push(value.substring(i -= g, i + g));
          if ((length += g + 1) > width) break;
          g = grouping[j = (j + 1) % grouping.length];
        }

        return t.reverse().join(thousands);
      };
    }

    function formatNumerals(numerals) {
      return function(value) {
        return value.replace(/[0-9]/g, function(i) {
          return numerals[+i];
        });
      };
    }

    // [[fill]align][sign][symbol][0][width][,][.precision][~][type]
    var re = /^(?:(.)?([<>=^]))?([+\-( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?(~)?([a-z%])?$/i;

    function formatSpecifier(specifier) {
      if (!(match = re.exec(specifier))) throw new Error("invalid format: " + specifier);
      var match;
      return new FormatSpecifier({
        fill: match[1],
        align: match[2],
        sign: match[3],
        symbol: match[4],
        zero: match[5],
        width: match[6],
        comma: match[7],
        precision: match[8] && match[8].slice(1),
        trim: match[9],
        type: match[10]
      });
    }

    formatSpecifier.prototype = FormatSpecifier.prototype; // instanceof

    function FormatSpecifier(specifier) {
      this.fill = specifier.fill === undefined ? " " : specifier.fill + "";
      this.align = specifier.align === undefined ? ">" : specifier.align + "";
      this.sign = specifier.sign === undefined ? "-" : specifier.sign + "";
      this.symbol = specifier.symbol === undefined ? "" : specifier.symbol + "";
      this.zero = !!specifier.zero;
      this.width = specifier.width === undefined ? undefined : +specifier.width;
      this.comma = !!specifier.comma;
      this.precision = specifier.precision === undefined ? undefined : +specifier.precision;
      this.trim = !!specifier.trim;
      this.type = specifier.type === undefined ? "" : specifier.type + "";
    }

    FormatSpecifier.prototype.toString = function() {
      return this.fill
          + this.align
          + this.sign
          + this.symbol
          + (this.zero ? "0" : "")
          + (this.width === undefined ? "" : Math.max(1, this.width | 0))
          + (this.comma ? "," : "")
          + (this.precision === undefined ? "" : "." + Math.max(0, this.precision | 0))
          + (this.trim ? "~" : "")
          + this.type;
    };

    // Trims insignificant zeros, e.g., replaces 1.2000k with 1.2k.
    function formatTrim(s) {
      out: for (var n = s.length, i = 1, i0 = -1, i1; i < n; ++i) {
        switch (s[i]) {
          case ".": i0 = i1 = i; break;
          case "0": if (i0 === 0) i0 = i; i1 = i; break;
          default: if (!+s[i]) break out; if (i0 > 0) i0 = 0; break;
        }
      }
      return i0 > 0 ? s.slice(0, i0) + s.slice(i1 + 1) : s;
    }

    var prefixExponent;

    function formatPrefixAuto(x, p) {
      var d = formatDecimalParts(x, p);
      if (!d) return x + "";
      var coefficient = d[0],
          exponent = d[1],
          i = exponent - (prefixExponent = Math.max(-8, Math.min(8, Math.floor(exponent / 3))) * 3) + 1,
          n = coefficient.length;
      return i === n ? coefficient
          : i > n ? coefficient + new Array(i - n + 1).join("0")
          : i > 0 ? coefficient.slice(0, i) + "." + coefficient.slice(i)
          : "0." + new Array(1 - i).join("0") + formatDecimalParts(x, Math.max(0, p + i - 1))[0]; // less than 1y!
    }

    function formatRounded(x, p) {
      var d = formatDecimalParts(x, p);
      if (!d) return x + "";
      var coefficient = d[0],
          exponent = d[1];
      return exponent < 0 ? "0." + new Array(-exponent).join("0") + coefficient
          : coefficient.length > exponent + 1 ? coefficient.slice(0, exponent + 1) + "." + coefficient.slice(exponent + 1)
          : coefficient + new Array(exponent - coefficient.length + 2).join("0");
    }

    var formatTypes = {
      "%": (x, p) => (x * 100).toFixed(p),
      "b": (x) => Math.round(x).toString(2),
      "c": (x) => x + "",
      "d": formatDecimal,
      "e": (x, p) => x.toExponential(p),
      "f": (x, p) => x.toFixed(p),
      "g": (x, p) => x.toPrecision(p),
      "o": (x) => Math.round(x).toString(8),
      "p": (x, p) => formatRounded(x * 100, p),
      "r": formatRounded,
      "s": formatPrefixAuto,
      "X": (x) => Math.round(x).toString(16).toUpperCase(),
      "x": (x) => Math.round(x).toString(16)
    };

    function identity$1(x) {
      return x;
    }

    var map = Array.prototype.map,
        prefixes = ["y","z","a","f","p","n","µ","m","","k","M","G","T","P","E","Z","Y"];

    function formatLocale$1(locale) {
      var group = locale.grouping === undefined || locale.thousands === undefined ? identity$1 : formatGroup(map.call(locale.grouping, Number), locale.thousands + ""),
          currencyPrefix = locale.currency === undefined ? "" : locale.currency[0] + "",
          currencySuffix = locale.currency === undefined ? "" : locale.currency[1] + "",
          decimal = locale.decimal === undefined ? "." : locale.decimal + "",
          numerals = locale.numerals === undefined ? identity$1 : formatNumerals(map.call(locale.numerals, String)),
          percent = locale.percent === undefined ? "%" : locale.percent + "",
          minus = locale.minus === undefined ? "−" : locale.minus + "",
          nan = locale.nan === undefined ? "NaN" : locale.nan + "";

      function newFormat(specifier) {
        specifier = formatSpecifier(specifier);

        var fill = specifier.fill,
            align = specifier.align,
            sign = specifier.sign,
            symbol = specifier.symbol,
            zero = specifier.zero,
            width = specifier.width,
            comma = specifier.comma,
            precision = specifier.precision,
            trim = specifier.trim,
            type = specifier.type;

        // The "n" type is an alias for ",g".
        if (type === "n") comma = true, type = "g";

        // The "" type, and any invalid type, is an alias for ".12~g".
        else if (!formatTypes[type]) precision === undefined && (precision = 12), trim = true, type = "g";

        // If zero fill is specified, padding goes after sign and before digits.
        if (zero || (fill === "0" && align === "=")) zero = true, fill = "0", align = "=";

        // Compute the prefix and suffix.
        // For SI-prefix, the suffix is lazily computed.
        var prefix = symbol === "$" ? currencyPrefix : symbol === "#" && /[boxX]/.test(type) ? "0" + type.toLowerCase() : "",
            suffix = symbol === "$" ? currencySuffix : /[%p]/.test(type) ? percent : "";

        // What format function should we use?
        // Is this an integer type?
        // Can this type generate exponential notation?
        var formatType = formatTypes[type],
            maybeSuffix = /[defgprs%]/.test(type);

        // Set the default precision if not specified,
        // or clamp the specified precision to the supported range.
        // For significant precision, it must be in [1, 21].
        // For fixed precision, it must be in [0, 20].
        precision = precision === undefined ? 6
            : /[gprs]/.test(type) ? Math.max(1, Math.min(21, precision))
            : Math.max(0, Math.min(20, precision));

        function format(value) {
          var valuePrefix = prefix,
              valueSuffix = suffix,
              i, n, c;

          if (type === "c") {
            valueSuffix = formatType(value) + valueSuffix;
            value = "";
          } else {
            value = +value;

            // Determine the sign. -0 is not less than 0, but 1 / -0 is!
            var valueNegative = value < 0 || 1 / value < 0;

            // Perform the initial formatting.
            value = isNaN(value) ? nan : formatType(Math.abs(value), precision);

            // Trim insignificant zeros.
            if (trim) value = formatTrim(value);

            // If a negative value rounds to zero after formatting, and no explicit positive sign is requested, hide the sign.
            if (valueNegative && +value === 0 && sign !== "+") valueNegative = false;

            // Compute the prefix and suffix.
            valuePrefix = (valueNegative ? (sign === "(" ? sign : minus) : sign === "-" || sign === "(" ? "" : sign) + valuePrefix;
            valueSuffix = (type === "s" ? prefixes[8 + prefixExponent / 3] : "") + valueSuffix + (valueNegative && sign === "(" ? ")" : "");

            // Break the formatted value into the integer “value” part that can be
            // grouped, and fractional or exponential “suffix” part that is not.
            if (maybeSuffix) {
              i = -1, n = value.length;
              while (++i < n) {
                if (c = value.charCodeAt(i), 48 > c || c > 57) {
                  valueSuffix = (c === 46 ? decimal + value.slice(i + 1) : value.slice(i)) + valueSuffix;
                  value = value.slice(0, i);
                  break;
                }
              }
            }
          }

          // If the fill character is not "0", grouping is applied before padding.
          if (comma && !zero) value = group(value, Infinity);

          // Compute the padding.
          var length = valuePrefix.length + value.length + valueSuffix.length,
              padding = length < width ? new Array(width - length + 1).join(fill) : "";

          // If the fill character is "0", grouping is applied after padding.
          if (comma && zero) value = group(padding + value, padding.length ? width - valueSuffix.length : Infinity), padding = "";

          // Reconstruct the final output based on the desired alignment.
          switch (align) {
            case "<": value = valuePrefix + value + valueSuffix + padding; break;
            case "=": value = valuePrefix + padding + value + valueSuffix; break;
            case "^": value = padding.slice(0, length = padding.length >> 1) + valuePrefix + value + valueSuffix + padding.slice(length); break;
            default: value = padding + valuePrefix + value + valueSuffix; break;
          }

          return numerals(value);
        }

        format.toString = function() {
          return specifier + "";
        };

        return format;
      }

      function formatPrefix(specifier, value) {
        var f = newFormat((specifier = formatSpecifier(specifier), specifier.type = "f", specifier)),
            e = Math.max(-8, Math.min(8, Math.floor(exponent(value) / 3))) * 3,
            k = Math.pow(10, -e),
            prefix = prefixes[8 + e / 3];
        return function(value) {
          return f(k * value) + prefix;
        };
      }

      return {
        format: newFormat,
        formatPrefix: formatPrefix
      };
    }

    var locale$1;
    var format;
    var formatPrefix;

    defaultLocale$1({
      thousands: ",",
      grouping: [3],
      currency: ["$", ""]
    });

    function defaultLocale$1(definition) {
      locale$1 = formatLocale$1(definition);
      format = locale$1.format;
      formatPrefix = locale$1.formatPrefix;
      return locale$1;
    }

    function precisionFixed(step) {
      return Math.max(0, -exponent(Math.abs(step)));
    }

    function precisionPrefix(step, value) {
      return Math.max(0, Math.max(-8, Math.min(8, Math.floor(exponent(value) / 3))) * 3 - exponent(Math.abs(step)));
    }

    function precisionRound(step, max) {
      step = Math.abs(step), max = Math.abs(max) - step;
      return Math.max(0, exponent(max) - exponent(step)) + 1;
    }

    function initRange(domain, range) {
      switch (arguments.length) {
        case 0: break;
        case 1: this.range(domain); break;
        default: this.range(range).domain(domain); break;
      }
      return this;
    }

    function constants(x) {
      return function() {
        return x;
      };
    }

    function number(x) {
      return +x;
    }

    var unit = [0, 1];

    function identity(x) {
      return x;
    }

    function normalize(a, b) {
      return (b -= (a = +a))
          ? function(x) { return (x - a) / b; }
          : constants(isNaN(b) ? NaN : 0.5);
    }

    function clamper(a, b) {
      var t;
      if (a > b) t = a, a = b, b = t;
      return function(x) { return Math.max(a, Math.min(b, x)); };
    }

    // normalize(a, b)(x) takes a domain value x in [a,b] and returns the corresponding parameter t in [0,1].
    // interpolate(a, b)(t) takes a parameter t in [0,1] and returns the corresponding range value x in [a,b].
    function bimap(domain, range, interpolate) {
      var d0 = domain[0], d1 = domain[1], r0 = range[0], r1 = range[1];
      if (d1 < d0) d0 = normalize(d1, d0), r0 = interpolate(r1, r0);
      else d0 = normalize(d0, d1), r0 = interpolate(r0, r1);
      return function(x) { return r0(d0(x)); };
    }

    function polymap(domain, range, interpolate) {
      var j = Math.min(domain.length, range.length) - 1,
          d = new Array(j),
          r = new Array(j),
          i = -1;

      // Reverse descending domains.
      if (domain[j] < domain[0]) {
        domain = domain.slice().reverse();
        range = range.slice().reverse();
      }

      while (++i < j) {
        d[i] = normalize(domain[i], domain[i + 1]);
        r[i] = interpolate(range[i], range[i + 1]);
      }

      return function(x) {
        var i = bisectRight(domain, x, 1, j) - 1;
        return r[i](d[i](x));
      };
    }

    function copy(source, target) {
      return target
          .domain(source.domain())
          .range(source.range())
          .interpolate(source.interpolate())
          .clamp(source.clamp())
          .unknown(source.unknown());
    }

    function transformer() {
      var domain = unit,
          range = unit,
          interpolate$1 = interpolate,
          transform,
          untransform,
          unknown,
          clamp = identity,
          piecewise,
          output,
          input;

      function rescale() {
        var n = Math.min(domain.length, range.length);
        if (clamp !== identity) clamp = clamper(domain[0], domain[n - 1]);
        piecewise = n > 2 ? polymap : bimap;
        output = input = null;
        return scale;
      }

      function scale(x) {
        return x == null || isNaN(x = +x) ? unknown : (output || (output = piecewise(domain.map(transform), range, interpolate$1)))(transform(clamp(x)));
      }

      scale.invert = function(y) {
        return clamp(untransform((input || (input = piecewise(range, domain.map(transform), interpolateNumber)))(y)));
      };

      scale.domain = function(_) {
        return arguments.length ? (domain = Array.from(_, number), rescale()) : domain.slice();
      };

      scale.range = function(_) {
        return arguments.length ? (range = Array.from(_), rescale()) : range.slice();
      };

      scale.rangeRound = function(_) {
        return range = Array.from(_), interpolate$1 = interpolateRound, rescale();
      };

      scale.clamp = function(_) {
        return arguments.length ? (clamp = _ ? true : identity, rescale()) : clamp !== identity;
      };

      scale.interpolate = function(_) {
        return arguments.length ? (interpolate$1 = _, rescale()) : interpolate$1;
      };

      scale.unknown = function(_) {
        return arguments.length ? (unknown = _, scale) : unknown;
      };

      return function(t, u) {
        transform = t, untransform = u;
        return rescale();
      };
    }

    function continuous() {
      return transformer()(identity, identity);
    }

    function tickFormat(start, stop, count, specifier) {
      var step = tickStep(start, stop, count),
          precision;
      specifier = formatSpecifier(specifier == null ? ",f" : specifier);
      switch (specifier.type) {
        case "s": {
          var value = Math.max(Math.abs(start), Math.abs(stop));
          if (specifier.precision == null && !isNaN(precision = precisionPrefix(step, value))) specifier.precision = precision;
          return formatPrefix(specifier, value);
        }
        case "":
        case "e":
        case "g":
        case "p":
        case "r": {
          if (specifier.precision == null && !isNaN(precision = precisionRound(step, Math.max(Math.abs(start), Math.abs(stop))))) specifier.precision = precision - (specifier.type === "e");
          break;
        }
        case "f":
        case "%": {
          if (specifier.precision == null && !isNaN(precision = precisionFixed(step))) specifier.precision = precision - (specifier.type === "%") * 2;
          break;
        }
      }
      return format(specifier);
    }

    function linearish(scale) {
      var domain = scale.domain;

      scale.ticks = function(count) {
        var d = domain();
        return ticks(d[0], d[d.length - 1], count == null ? 10 : count);
      };

      scale.tickFormat = function(count, specifier) {
        var d = domain();
        return tickFormat(d[0], d[d.length - 1], count == null ? 10 : count, specifier);
      };

      scale.nice = function(count) {
        if (count == null) count = 10;

        var d = domain();
        var i0 = 0;
        var i1 = d.length - 1;
        var start = d[i0];
        var stop = d[i1];
        var prestep;
        var step;
        var maxIter = 10;

        if (stop < start) {
          step = start, start = stop, stop = step;
          step = i0, i0 = i1, i1 = step;
        }
        
        while (maxIter-- > 0) {
          step = tickIncrement(start, stop, count);
          if (step === prestep) {
            d[i0] = start;
            d[i1] = stop;
            return domain(d);
          } else if (step > 0) {
            start = Math.floor(start / step) * step;
            stop = Math.ceil(stop / step) * step;
          } else if (step < 0) {
            start = Math.ceil(start * step) / step;
            stop = Math.floor(stop * step) / step;
          } else {
            break;
          }
          prestep = step;
        }

        return scale;
      };

      return scale;
    }

    function linear() {
      var scale = continuous();

      scale.copy = function() {
        return copy(scale, linear());
      };

      initRange.apply(scale, arguments);

      return linearish(scale);
    }

    var t0 = new Date,
        t1 = new Date;

    function newInterval(floori, offseti, count, field) {

      function interval(date) {
        return floori(date = arguments.length === 0 ? new Date : new Date(+date)), date;
      }

      interval.floor = function(date) {
        return floori(date = new Date(+date)), date;
      };

      interval.ceil = function(date) {
        return floori(date = new Date(date - 1)), offseti(date, 1), floori(date), date;
      };

      interval.round = function(date) {
        var d0 = interval(date),
            d1 = interval.ceil(date);
        return date - d0 < d1 - date ? d0 : d1;
      };

      interval.offset = function(date, step) {
        return offseti(date = new Date(+date), step == null ? 1 : Math.floor(step)), date;
      };

      interval.range = function(start, stop, step) {
        var range = [], previous;
        start = interval.ceil(start);
        step = step == null ? 1 : Math.floor(step);
        if (!(start < stop) || !(step > 0)) return range; // also handles Invalid Date
        do range.push(previous = new Date(+start)), offseti(start, step), floori(start);
        while (previous < start && start < stop);
        return range;
      };

      interval.filter = function(test) {
        return newInterval(function(date) {
          if (date >= date) while (floori(date), !test(date)) date.setTime(date - 1);
        }, function(date, step) {
          if (date >= date) {
            if (step < 0) while (++step <= 0) {
              while (offseti(date, -1), !test(date)) {} // eslint-disable-line no-empty
            } else while (--step >= 0) {
              while (offseti(date, +1), !test(date)) {} // eslint-disable-line no-empty
            }
          }
        });
      };

      if (count) {
        interval.count = function(start, end) {
          t0.setTime(+start), t1.setTime(+end);
          floori(t0), floori(t1);
          return Math.floor(count(t0, t1));
        };

        interval.every = function(step) {
          step = Math.floor(step);
          return !isFinite(step) || !(step > 0) ? null
              : !(step > 1) ? interval
              : interval.filter(field
                  ? function(d) { return field(d) % step === 0; }
                  : function(d) { return interval.count(0, d) % step === 0; });
        };
      }

      return interval;
    }

    var durationMinute = 6e4;
    var durationDay = 864e5;
    var durationWeek = 6048e5;

    var day = newInterval(
      date => date.setHours(0, 0, 0, 0),
      (date, step) => date.setDate(date.getDate() + step),
      (start, end) => (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute) / durationDay,
      date => date.getDate() - 1
    );

    function weekday(i) {
      return newInterval(function(date) {
        date.setDate(date.getDate() - (date.getDay() + 7 - i) % 7);
        date.setHours(0, 0, 0, 0);
      }, function(date, step) {
        date.setDate(date.getDate() + step * 7);
      }, function(start, end) {
        return (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute) / durationWeek;
      });
    }

    var sunday = weekday(0);
    var monday = weekday(1);
    weekday(2);
    weekday(3);
    var thursday = weekday(4);
    weekday(5);
    weekday(6);

    var year = newInterval(function(date) {
      date.setMonth(0, 1);
      date.setHours(0, 0, 0, 0);
    }, function(date, step) {
      date.setFullYear(date.getFullYear() + step);
    }, function(start, end) {
      return end.getFullYear() - start.getFullYear();
    }, function(date) {
      return date.getFullYear();
    });

    // An optimized implementation for this simple case.
    year.every = function(k) {
      return !isFinite(k = Math.floor(k)) || !(k > 0) ? null : newInterval(function(date) {
        date.setFullYear(Math.floor(date.getFullYear() / k) * k);
        date.setMonth(0, 1);
        date.setHours(0, 0, 0, 0);
      }, function(date, step) {
        date.setFullYear(date.getFullYear() + step * k);
      });
    };

    var utcDay = newInterval(function(date) {
      date.setUTCHours(0, 0, 0, 0);
    }, function(date, step) {
      date.setUTCDate(date.getUTCDate() + step);
    }, function(start, end) {
      return (end - start) / durationDay;
    }, function(date) {
      return date.getUTCDate() - 1;
    });

    function utcWeekday(i) {
      return newInterval(function(date) {
        date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 7 - i) % 7);
        date.setUTCHours(0, 0, 0, 0);
      }, function(date, step) {
        date.setUTCDate(date.getUTCDate() + step * 7);
      }, function(start, end) {
        return (end - start) / durationWeek;
      });
    }

    var utcSunday = utcWeekday(0);
    var utcMonday = utcWeekday(1);
    utcWeekday(2);
    utcWeekday(3);
    var utcThursday = utcWeekday(4);
    utcWeekday(5);
    utcWeekday(6);

    var utcYear = newInterval(function(date) {
      date.setUTCMonth(0, 1);
      date.setUTCHours(0, 0, 0, 0);
    }, function(date, step) {
      date.setUTCFullYear(date.getUTCFullYear() + step);
    }, function(start, end) {
      return end.getUTCFullYear() - start.getUTCFullYear();
    }, function(date) {
      return date.getUTCFullYear();
    });

    // An optimized implementation for this simple case.
    utcYear.every = function(k) {
      return !isFinite(k = Math.floor(k)) || !(k > 0) ? null : newInterval(function(date) {
        date.setUTCFullYear(Math.floor(date.getUTCFullYear() / k) * k);
        date.setUTCMonth(0, 1);
        date.setUTCHours(0, 0, 0, 0);
      }, function(date, step) {
        date.setUTCFullYear(date.getUTCFullYear() + step * k);
      });
    };

    function localDate(d) {
      if (0 <= d.y && d.y < 100) {
        var date = new Date(-1, d.m, d.d, d.H, d.M, d.S, d.L);
        date.setFullYear(d.y);
        return date;
      }
      return new Date(d.y, d.m, d.d, d.H, d.M, d.S, d.L);
    }

    function utcDate(d) {
      if (0 <= d.y && d.y < 100) {
        var date = new Date(Date.UTC(-1, d.m, d.d, d.H, d.M, d.S, d.L));
        date.setUTCFullYear(d.y);
        return date;
      }
      return new Date(Date.UTC(d.y, d.m, d.d, d.H, d.M, d.S, d.L));
    }

    function newDate(y, m, d) {
      return {y: y, m: m, d: d, H: 0, M: 0, S: 0, L: 0};
    }

    function formatLocale(locale) {
      var locale_dateTime = locale.dateTime,
          locale_date = locale.date,
          locale_time = locale.time,
          locale_periods = locale.periods,
          locale_weekdays = locale.days,
          locale_shortWeekdays = locale.shortDays,
          locale_months = locale.months,
          locale_shortMonths = locale.shortMonths;

      var periodRe = formatRe(locale_periods),
          periodLookup = formatLookup(locale_periods),
          weekdayRe = formatRe(locale_weekdays),
          weekdayLookup = formatLookup(locale_weekdays),
          shortWeekdayRe = formatRe(locale_shortWeekdays),
          shortWeekdayLookup = formatLookup(locale_shortWeekdays),
          monthRe = formatRe(locale_months),
          monthLookup = formatLookup(locale_months),
          shortMonthRe = formatRe(locale_shortMonths),
          shortMonthLookup = formatLookup(locale_shortMonths);

      var formats = {
        "a": formatShortWeekday,
        "A": formatWeekday,
        "b": formatShortMonth,
        "B": formatMonth,
        "c": null,
        "d": formatDayOfMonth,
        "e": formatDayOfMonth,
        "f": formatMicroseconds,
        "g": formatYearISO,
        "G": formatFullYearISO,
        "H": formatHour24,
        "I": formatHour12,
        "j": formatDayOfYear,
        "L": formatMilliseconds,
        "m": formatMonthNumber,
        "M": formatMinutes,
        "p": formatPeriod,
        "q": formatQuarter,
        "Q": formatUnixTimestamp,
        "s": formatUnixTimestampSeconds,
        "S": formatSeconds,
        "u": formatWeekdayNumberMonday,
        "U": formatWeekNumberSunday,
        "V": formatWeekNumberISO,
        "w": formatWeekdayNumberSunday,
        "W": formatWeekNumberMonday,
        "x": null,
        "X": null,
        "y": formatYear,
        "Y": formatFullYear,
        "Z": formatZone,
        "%": formatLiteralPercent
      };

      var utcFormats = {
        "a": formatUTCShortWeekday,
        "A": formatUTCWeekday,
        "b": formatUTCShortMonth,
        "B": formatUTCMonth,
        "c": null,
        "d": formatUTCDayOfMonth,
        "e": formatUTCDayOfMonth,
        "f": formatUTCMicroseconds,
        "g": formatUTCYearISO,
        "G": formatUTCFullYearISO,
        "H": formatUTCHour24,
        "I": formatUTCHour12,
        "j": formatUTCDayOfYear,
        "L": formatUTCMilliseconds,
        "m": formatUTCMonthNumber,
        "M": formatUTCMinutes,
        "p": formatUTCPeriod,
        "q": formatUTCQuarter,
        "Q": formatUnixTimestamp,
        "s": formatUnixTimestampSeconds,
        "S": formatUTCSeconds,
        "u": formatUTCWeekdayNumberMonday,
        "U": formatUTCWeekNumberSunday,
        "V": formatUTCWeekNumberISO,
        "w": formatUTCWeekdayNumberSunday,
        "W": formatUTCWeekNumberMonday,
        "x": null,
        "X": null,
        "y": formatUTCYear,
        "Y": formatUTCFullYear,
        "Z": formatUTCZone,
        "%": formatLiteralPercent
      };

      var parses = {
        "a": parseShortWeekday,
        "A": parseWeekday,
        "b": parseShortMonth,
        "B": parseMonth,
        "c": parseLocaleDateTime,
        "d": parseDayOfMonth,
        "e": parseDayOfMonth,
        "f": parseMicroseconds,
        "g": parseYear,
        "G": parseFullYear,
        "H": parseHour24,
        "I": parseHour24,
        "j": parseDayOfYear,
        "L": parseMilliseconds,
        "m": parseMonthNumber,
        "M": parseMinutes,
        "p": parsePeriod,
        "q": parseQuarter,
        "Q": parseUnixTimestamp,
        "s": parseUnixTimestampSeconds,
        "S": parseSeconds,
        "u": parseWeekdayNumberMonday,
        "U": parseWeekNumberSunday,
        "V": parseWeekNumberISO,
        "w": parseWeekdayNumberSunday,
        "W": parseWeekNumberMonday,
        "x": parseLocaleDate,
        "X": parseLocaleTime,
        "y": parseYear,
        "Y": parseFullYear,
        "Z": parseZone,
        "%": parseLiteralPercent
      };

      // These recursive directive definitions must be deferred.
      formats.x = newFormat(locale_date, formats);
      formats.X = newFormat(locale_time, formats);
      formats.c = newFormat(locale_dateTime, formats);
      utcFormats.x = newFormat(locale_date, utcFormats);
      utcFormats.X = newFormat(locale_time, utcFormats);
      utcFormats.c = newFormat(locale_dateTime, utcFormats);

      function newFormat(specifier, formats) {
        return function(date) {
          var string = [],
              i = -1,
              j = 0,
              n = specifier.length,
              c,
              pad,
              format;

          if (!(date instanceof Date)) date = new Date(+date);

          while (++i < n) {
            if (specifier.charCodeAt(i) === 37) {
              string.push(specifier.slice(j, i));
              if ((pad = pads[c = specifier.charAt(++i)]) != null) c = specifier.charAt(++i);
              else pad = c === "e" ? " " : "0";
              if (format = formats[c]) c = format(date, pad);
              string.push(c);
              j = i + 1;
            }
          }

          string.push(specifier.slice(j, i));
          return string.join("");
        };
      }

      function newParse(specifier, Z) {
        return function(string) {
          var d = newDate(1900, undefined, 1),
              i = parseSpecifier(d, specifier, string += "", 0),
              week, day$1;
          if (i != string.length) return null;

          // If a UNIX timestamp is specified, return it.
          if ("Q" in d) return new Date(d.Q);
          if ("s" in d) return new Date(d.s * 1000 + ("L" in d ? d.L : 0));

          // If this is utcParse, never use the local timezone.
          if (Z && !("Z" in d)) d.Z = 0;

          // The am-pm flag is 0 for AM, and 1 for PM.
          if ("p" in d) d.H = d.H % 12 + d.p * 12;

          // If the month was not specified, inherit from the quarter.
          if (d.m === undefined) d.m = "q" in d ? d.q : 0;

          // Convert day-of-week and week-of-year to day-of-year.
          if ("V" in d) {
            if (d.V < 1 || d.V > 53) return null;
            if (!("w" in d)) d.w = 1;
            if ("Z" in d) {
              week = utcDate(newDate(d.y, 0, 1)), day$1 = week.getUTCDay();
              week = day$1 > 4 || day$1 === 0 ? utcMonday.ceil(week) : utcMonday(week);
              week = utcDay.offset(week, (d.V - 1) * 7);
              d.y = week.getUTCFullYear();
              d.m = week.getUTCMonth();
              d.d = week.getUTCDate() + (d.w + 6) % 7;
            } else {
              week = localDate(newDate(d.y, 0, 1)), day$1 = week.getDay();
              week = day$1 > 4 || day$1 === 0 ? monday.ceil(week) : monday(week);
              week = day.offset(week, (d.V - 1) * 7);
              d.y = week.getFullYear();
              d.m = week.getMonth();
              d.d = week.getDate() + (d.w + 6) % 7;
            }
          } else if ("W" in d || "U" in d) {
            if (!("w" in d)) d.w = "u" in d ? d.u % 7 : "W" in d ? 1 : 0;
            day$1 = "Z" in d ? utcDate(newDate(d.y, 0, 1)).getUTCDay() : localDate(newDate(d.y, 0, 1)).getDay();
            d.m = 0;
            d.d = "W" in d ? (d.w + 6) % 7 + d.W * 7 - (day$1 + 5) % 7 : d.w + d.U * 7 - (day$1 + 6) % 7;
          }

          // If a time zone is specified, all fields are interpreted as UTC and then
          // offset according to the specified time zone.
          if ("Z" in d) {
            d.H += d.Z / 100 | 0;
            d.M += d.Z % 100;
            return utcDate(d);
          }

          // Otherwise, all fields are in local time.
          return localDate(d);
        };
      }

      function parseSpecifier(d, specifier, string, j) {
        var i = 0,
            n = specifier.length,
            m = string.length,
            c,
            parse;

        while (i < n) {
          if (j >= m) return -1;
          c = specifier.charCodeAt(i++);
          if (c === 37) {
            c = specifier.charAt(i++);
            parse = parses[c in pads ? specifier.charAt(i++) : c];
            if (!parse || ((j = parse(d, string, j)) < 0)) return -1;
          } else if (c != string.charCodeAt(j++)) {
            return -1;
          }
        }

        return j;
      }

      function parsePeriod(d, string, i) {
        var n = periodRe.exec(string.slice(i));
        return n ? (d.p = periodLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
      }

      function parseShortWeekday(d, string, i) {
        var n = shortWeekdayRe.exec(string.slice(i));
        return n ? (d.w = shortWeekdayLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
      }

      function parseWeekday(d, string, i) {
        var n = weekdayRe.exec(string.slice(i));
        return n ? (d.w = weekdayLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
      }

      function parseShortMonth(d, string, i) {
        var n = shortMonthRe.exec(string.slice(i));
        return n ? (d.m = shortMonthLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
      }

      function parseMonth(d, string, i) {
        var n = monthRe.exec(string.slice(i));
        return n ? (d.m = monthLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
      }

      function parseLocaleDateTime(d, string, i) {
        return parseSpecifier(d, locale_dateTime, string, i);
      }

      function parseLocaleDate(d, string, i) {
        return parseSpecifier(d, locale_date, string, i);
      }

      function parseLocaleTime(d, string, i) {
        return parseSpecifier(d, locale_time, string, i);
      }

      function formatShortWeekday(d) {
        return locale_shortWeekdays[d.getDay()];
      }

      function formatWeekday(d) {
        return locale_weekdays[d.getDay()];
      }

      function formatShortMonth(d) {
        return locale_shortMonths[d.getMonth()];
      }

      function formatMonth(d) {
        return locale_months[d.getMonth()];
      }

      function formatPeriod(d) {
        return locale_periods[+(d.getHours() >= 12)];
      }

      function formatQuarter(d) {
        return 1 + ~~(d.getMonth() / 3);
      }

      function formatUTCShortWeekday(d) {
        return locale_shortWeekdays[d.getUTCDay()];
      }

      function formatUTCWeekday(d) {
        return locale_weekdays[d.getUTCDay()];
      }

      function formatUTCShortMonth(d) {
        return locale_shortMonths[d.getUTCMonth()];
      }

      function formatUTCMonth(d) {
        return locale_months[d.getUTCMonth()];
      }

      function formatUTCPeriod(d) {
        return locale_periods[+(d.getUTCHours() >= 12)];
      }

      function formatUTCQuarter(d) {
        return 1 + ~~(d.getUTCMonth() / 3);
      }

      return {
        format: function(specifier) {
          var f = newFormat(specifier += "", formats);
          f.toString = function() { return specifier; };
          return f;
        },
        parse: function(specifier) {
          var p = newParse(specifier += "", false);
          p.toString = function() { return specifier; };
          return p;
        },
        utcFormat: function(specifier) {
          var f = newFormat(specifier += "", utcFormats);
          f.toString = function() { return specifier; };
          return f;
        },
        utcParse: function(specifier) {
          var p = newParse(specifier += "", true);
          p.toString = function() { return specifier; };
          return p;
        }
      };
    }

    var pads = {"-": "", "_": " ", "0": "0"},
        numberRe = /^\s*\d+/, // note: ignores next directive
        percentRe = /^%/,
        requoteRe = /[\\^$*+?|[\]().{}]/g;

    function pad(value, fill, width) {
      var sign = value < 0 ? "-" : "",
          string = (sign ? -value : value) + "",
          length = string.length;
      return sign + (length < width ? new Array(width - length + 1).join(fill) + string : string);
    }

    function requote(s) {
      return s.replace(requoteRe, "\\$&");
    }

    function formatRe(names) {
      return new RegExp("^(?:" + names.map(requote).join("|") + ")", "i");
    }

    function formatLookup(names) {
      return new Map(names.map((name, i) => [name.toLowerCase(), i]));
    }

    function parseWeekdayNumberSunday(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 1));
      return n ? (d.w = +n[0], i + n[0].length) : -1;
    }

    function parseWeekdayNumberMonday(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 1));
      return n ? (d.u = +n[0], i + n[0].length) : -1;
    }

    function parseWeekNumberSunday(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 2));
      return n ? (d.U = +n[0], i + n[0].length) : -1;
    }

    function parseWeekNumberISO(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 2));
      return n ? (d.V = +n[0], i + n[0].length) : -1;
    }

    function parseWeekNumberMonday(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 2));
      return n ? (d.W = +n[0], i + n[0].length) : -1;
    }

    function parseFullYear(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 4));
      return n ? (d.y = +n[0], i + n[0].length) : -1;
    }

    function parseYear(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 2));
      return n ? (d.y = +n[0] + (+n[0] > 68 ? 1900 : 2000), i + n[0].length) : -1;
    }

    function parseZone(d, string, i) {
      var n = /^(Z)|([+-]\d\d)(?::?(\d\d))?/.exec(string.slice(i, i + 6));
      return n ? (d.Z = n[1] ? 0 : -(n[2] + (n[3] || "00")), i + n[0].length) : -1;
    }

    function parseQuarter(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 1));
      return n ? (d.q = n[0] * 3 - 3, i + n[0].length) : -1;
    }

    function parseMonthNumber(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 2));
      return n ? (d.m = n[0] - 1, i + n[0].length) : -1;
    }

    function parseDayOfMonth(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 2));
      return n ? (d.d = +n[0], i + n[0].length) : -1;
    }

    function parseDayOfYear(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 3));
      return n ? (d.m = 0, d.d = +n[0], i + n[0].length) : -1;
    }

    function parseHour24(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 2));
      return n ? (d.H = +n[0], i + n[0].length) : -1;
    }

    function parseMinutes(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 2));
      return n ? (d.M = +n[0], i + n[0].length) : -1;
    }

    function parseSeconds(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 2));
      return n ? (d.S = +n[0], i + n[0].length) : -1;
    }

    function parseMilliseconds(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 3));
      return n ? (d.L = +n[0], i + n[0].length) : -1;
    }

    function parseMicroseconds(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 6));
      return n ? (d.L = Math.floor(n[0] / 1000), i + n[0].length) : -1;
    }

    function parseLiteralPercent(d, string, i) {
      var n = percentRe.exec(string.slice(i, i + 1));
      return n ? i + n[0].length : -1;
    }

    function parseUnixTimestamp(d, string, i) {
      var n = numberRe.exec(string.slice(i));
      return n ? (d.Q = +n[0], i + n[0].length) : -1;
    }

    function parseUnixTimestampSeconds(d, string, i) {
      var n = numberRe.exec(string.slice(i));
      return n ? (d.s = +n[0], i + n[0].length) : -1;
    }

    function formatDayOfMonth(d, p) {
      return pad(d.getDate(), p, 2);
    }

    function formatHour24(d, p) {
      return pad(d.getHours(), p, 2);
    }

    function formatHour12(d, p) {
      return pad(d.getHours() % 12 || 12, p, 2);
    }

    function formatDayOfYear(d, p) {
      return pad(1 + day.count(year(d), d), p, 3);
    }

    function formatMilliseconds(d, p) {
      return pad(d.getMilliseconds(), p, 3);
    }

    function formatMicroseconds(d, p) {
      return formatMilliseconds(d, p) + "000";
    }

    function formatMonthNumber(d, p) {
      return pad(d.getMonth() + 1, p, 2);
    }

    function formatMinutes(d, p) {
      return pad(d.getMinutes(), p, 2);
    }

    function formatSeconds(d, p) {
      return pad(d.getSeconds(), p, 2);
    }

    function formatWeekdayNumberMonday(d) {
      var day = d.getDay();
      return day === 0 ? 7 : day;
    }

    function formatWeekNumberSunday(d, p) {
      return pad(sunday.count(year(d) - 1, d), p, 2);
    }

    function dISO(d) {
      var day = d.getDay();
      return (day >= 4 || day === 0) ? thursday(d) : thursday.ceil(d);
    }

    function formatWeekNumberISO(d, p) {
      d = dISO(d);
      return pad(thursday.count(year(d), d) + (year(d).getDay() === 4), p, 2);
    }

    function formatWeekdayNumberSunday(d) {
      return d.getDay();
    }

    function formatWeekNumberMonday(d, p) {
      return pad(monday.count(year(d) - 1, d), p, 2);
    }

    function formatYear(d, p) {
      return pad(d.getFullYear() % 100, p, 2);
    }

    function formatYearISO(d, p) {
      d = dISO(d);
      return pad(d.getFullYear() % 100, p, 2);
    }

    function formatFullYear(d, p) {
      return pad(d.getFullYear() % 10000, p, 4);
    }

    function formatFullYearISO(d, p) {
      var day = d.getDay();
      d = (day >= 4 || day === 0) ? thursday(d) : thursday.ceil(d);
      return pad(d.getFullYear() % 10000, p, 4);
    }

    function formatZone(d) {
      var z = d.getTimezoneOffset();
      return (z > 0 ? "-" : (z *= -1, "+"))
          + pad(z / 60 | 0, "0", 2)
          + pad(z % 60, "0", 2);
    }

    function formatUTCDayOfMonth(d, p) {
      return pad(d.getUTCDate(), p, 2);
    }

    function formatUTCHour24(d, p) {
      return pad(d.getUTCHours(), p, 2);
    }

    function formatUTCHour12(d, p) {
      return pad(d.getUTCHours() % 12 || 12, p, 2);
    }

    function formatUTCDayOfYear(d, p) {
      return pad(1 + utcDay.count(utcYear(d), d), p, 3);
    }

    function formatUTCMilliseconds(d, p) {
      return pad(d.getUTCMilliseconds(), p, 3);
    }

    function formatUTCMicroseconds(d, p) {
      return formatUTCMilliseconds(d, p) + "000";
    }

    function formatUTCMonthNumber(d, p) {
      return pad(d.getUTCMonth() + 1, p, 2);
    }

    function formatUTCMinutes(d, p) {
      return pad(d.getUTCMinutes(), p, 2);
    }

    function formatUTCSeconds(d, p) {
      return pad(d.getUTCSeconds(), p, 2);
    }

    function formatUTCWeekdayNumberMonday(d) {
      var dow = d.getUTCDay();
      return dow === 0 ? 7 : dow;
    }

    function formatUTCWeekNumberSunday(d, p) {
      return pad(utcSunday.count(utcYear(d) - 1, d), p, 2);
    }

    function UTCdISO(d) {
      var day = d.getUTCDay();
      return (day >= 4 || day === 0) ? utcThursday(d) : utcThursday.ceil(d);
    }

    function formatUTCWeekNumberISO(d, p) {
      d = UTCdISO(d);
      return pad(utcThursday.count(utcYear(d), d) + (utcYear(d).getUTCDay() === 4), p, 2);
    }

    function formatUTCWeekdayNumberSunday(d) {
      return d.getUTCDay();
    }

    function formatUTCWeekNumberMonday(d, p) {
      return pad(utcMonday.count(utcYear(d) - 1, d), p, 2);
    }

    function formatUTCYear(d, p) {
      return pad(d.getUTCFullYear() % 100, p, 2);
    }

    function formatUTCYearISO(d, p) {
      d = UTCdISO(d);
      return pad(d.getUTCFullYear() % 100, p, 2);
    }

    function formatUTCFullYear(d, p) {
      return pad(d.getUTCFullYear() % 10000, p, 4);
    }

    function formatUTCFullYearISO(d, p) {
      var day = d.getUTCDay();
      d = (day >= 4 || day === 0) ? utcThursday(d) : utcThursday.ceil(d);
      return pad(d.getUTCFullYear() % 10000, p, 4);
    }

    function formatUTCZone() {
      return "+0000";
    }

    function formatLiteralPercent() {
      return "%";
    }

    function formatUnixTimestamp(d) {
      return +d;
    }

    function formatUnixTimestampSeconds(d) {
      return Math.floor(+d / 1000);
    }

    var locale;
    var timeParse;

    defaultLocale({
      dateTime: "%x, %X",
      date: "%-m/%-d/%Y",
      time: "%-I:%M:%S %p",
      periods: ["AM", "PM"],
      days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      shortDays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
      shortMonths: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    });

    function defaultLocale(definition) {
      locale = formatLocale(definition);
      locale.format;
      timeParse = locale.parse;
      locale.utcFormat;
      locale.utcParse;
      return locale;
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop$1) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop$1) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop$1;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    function is_date(obj) {
        return Object.prototype.toString.call(obj) === '[object Date]';
    }

    function get_interpolator(a, b) {
        if (a === b || a !== a)
            return () => a;
        const type = typeof a;
        if (type !== typeof b || Array.isArray(a) !== Array.isArray(b)) {
            throw new Error('Cannot interpolate values of different type');
        }
        if (Array.isArray(a)) {
            const arr = b.map((bi, i) => {
                return get_interpolator(a[i], bi);
            });
            return t => arr.map(fn => fn(t));
        }
        if (type === 'object') {
            if (!a || !b)
                throw new Error('Object cannot be null');
            if (is_date(a) && is_date(b)) {
                a = a.getTime();
                b = b.getTime();
                const delta = b - a;
                return t => new Date(a + t * delta);
            }
            const keys = Object.keys(b);
            const interpolators = {};
            keys.forEach(key => {
                interpolators[key] = get_interpolator(a[key], b[key]);
            });
            return t => {
                const result = {};
                keys.forEach(key => {
                    result[key] = interpolators[key](t);
                });
                return result;
            };
        }
        if (type === 'number') {
            const delta = b - a;
            return t => a + t * delta;
        }
        throw new Error(`Cannot interpolate ${type} values`);
    }
    function tweened(value, defaults = {}) {
        const store = writable(value);
        let task;
        let target_value = value;
        function set(new_value, opts) {
            if (value == null) {
                store.set(value = new_value);
                return Promise.resolve();
            }
            target_value = new_value;
            let previous_task = task;
            let started = false;
            let { delay = 0, duration = 400, easing = identity$2, interpolate = get_interpolator } = assign(assign({}, defaults), opts);
            if (duration === 0) {
                if (previous_task) {
                    previous_task.abort();
                    previous_task = null;
                }
                store.set(value = target_value);
                return Promise.resolve();
            }
            const start = now() + delay;
            let fn;
            task = loop(now => {
                if (now < start)
                    return true;
                if (!started) {
                    fn = interpolate(value, new_value);
                    if (typeof duration === 'function')
                        duration = duration(value, new_value);
                    started = true;
                }
                if (previous_task) {
                    previous_task.abort();
                    previous_task = null;
                }
                const elapsed = now - start;
                if (elapsed > duration) {
                    store.set(value = new_value);
                    return false;
                }
                // @ts-ignore
                store.set(value = fn(easing(elapsed / duration)));
                return true;
            });
            return task.promise;
        }
        return {
            set,
            update: (fn, opts) => set(fn(target_value, value), opts),
            subscribe: store.subscribe
        };
    }

    let req;
    let prev;
    const elapsed = writable(0);

    const tick = (timestamp) => {
    	if (!prev) prev = timestamp;
    	const diff = Math.round(timestamp - prev);
    	prev = timestamp;
    	elapsed.update(e => e + diff);
    	req = window.requestAnimationFrame(tick);
    };

    const timer = {
    	start() {
    		if (typeof window === "undefined")  return;
    		else if (!req) {
    			prev = null;
    			req = window.requestAnimationFrame(tick);
    		}
    	},
    	stop() {
    		if (typeof window === "undefined")  return;
    		else if (req) {
    			window.cancelAnimationFrame(req);
    			req = null;
    		}
    	},
    	toggle() {
    		req ? timer.stop() : timer.start();	
    	},
    	set(val) {
    		if (typeof val === "number") elapsed.set(val);
    	},
    	reset() {
    		timer.set(0);
    	}
    };

    /* src\Timer.svelte generated by Svelte v3.37.0 */
    const file$6 = "src\\Timer.svelte";

    function create_fragment$9(ctx) {
    	let div;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			button.textContent = "Replay";
    			attr_dev(button, "class", "svelte-o770be");
    			add_location(button, file$6, 24, 2, 581);
    			attr_dev(div, "class", "svelte-o770be");
    			add_location(div, file$6, 22, 0, 570);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*onReset*/ ctx[0], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop$1,
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let $elapsed;
    	validate_store(elapsed, "elapsed");
    	component_subscribe($$self, elapsed, $$value => $$invalidate(5, $elapsed = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Timer", slots, []);
    	let { currentKeyframe = 0 } = $$props;
    	let { keyframeCount = 0 } = $$props;
    	let { duration = 1000 } = $$props;
    	let { isEnabled = false } = $$props;
    	const dispatch = createEventDispatcher();

    	const onReset = () => {
    		$$invalidate(1, currentKeyframe = 0);
    		timer.reset();
    	};

    	const writable_props = ["currentKeyframe", "keyframeCount", "duration", "isEnabled"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Timer> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("currentKeyframe" in $$props) $$invalidate(1, currentKeyframe = $$props.currentKeyframe);
    		if ("keyframeCount" in $$props) $$invalidate(2, keyframeCount = $$props.keyframeCount);
    		if ("duration" in $$props) $$invalidate(3, duration = $$props.duration);
    		if ("isEnabled" in $$props) $$invalidate(4, isEnabled = $$props.isEnabled);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		timer,
    		elapsed,
    		currentKeyframe,
    		keyframeCount,
    		duration,
    		isEnabled,
    		dispatch,
    		onReset,
    		$elapsed
    	});

    	$$self.$inject_state = $$props => {
    		if ("currentKeyframe" in $$props) $$invalidate(1, currentKeyframe = $$props.currentKeyframe);
    		if ("keyframeCount" in $$props) $$invalidate(2, keyframeCount = $$props.keyframeCount);
    		if ("duration" in $$props) $$invalidate(3, duration = $$props.duration);
    		if ("isEnabled" in $$props) $$invalidate(4, isEnabled = $$props.isEnabled);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*isEnabled, $elapsed, duration*/ 56) {
    			if (isEnabled) $$invalidate(1, currentKeyframe = Math.floor($elapsed / duration));
    		}

    		if ($$self.$$.dirty & /*currentKeyframe, keyframeCount*/ 6) {
    			if (currentKeyframe === keyframeCount) dispatch("end");
    		}

    		if ($$self.$$.dirty & /*isEnabled*/ 16) {
    			isEnabled ? timer.start() : timer.stop();
    		}
    	};

    	return [onReset, currentKeyframe, keyframeCount, duration, isEnabled, $elapsed];
    }

    class Timer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {
    			currentKeyframe: 1,
    			keyframeCount: 2,
    			duration: 3,
    			isEnabled: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Timer",
    			options,
    			id: create_fragment$9.name
    		});
    	}

    	get currentKeyframe() {
    		throw new Error("<Timer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set currentKeyframe(value) {
    		throw new Error("<Timer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get keyframeCount() {
    		throw new Error("<Timer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set keyframeCount(value) {
    		throw new Error("<Timer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get duration() {
    		throw new Error("<Timer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set duration(value) {
    		throw new Error("<Timer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isEnabled() {
    		throw new Error("<Timer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isEnabled(value) {
    		throw new Error("<Timer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Chart.Bar.svelte generated by Svelte v3.37.0 */
    const file$5 = "src\\Chart.Bar.svelte";

    function create_fragment$8(ctx) {
    	let div;
    	let div_style_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "style", div_style_value = "" + (/*barColor*/ ctx[0] + " " + /*transform*/ ctx[1] + " " + /*width*/ ctx[2] + " " + /*height*/ ctx[3]));
    			attr_dev(div, "class", "svelte-18ofpc0");
    			add_location(div, file$5, 18, 0, 505);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*barColor, transform, width, height*/ 15 && div_style_value !== (div_style_value = "" + (/*barColor*/ ctx[0] + " " + /*transform*/ ctx[1] + " " + /*width*/ ctx[2] + " " + /*height*/ ctx[3]))) {
    				attr_dev(div, "style", div_style_value);
    			}
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const borderWidth = 4;

    function instance$8($$self, $$props, $$invalidate) {
    	let w;
    	let y;
    	let barColor;
    	let transform;
    	let width;
    	let height;
    	let $scales;
    	let $dimensions;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Chart_Bar", slots, []);
    	const { scales, dimensions } = getContext("Chart");
    	validate_store(scales, "scales");
    	component_subscribe($$self, scales, value => $$invalidate(10, $scales = value));
    	validate_store(dimensions, "dimensions");
    	component_subscribe($$self, dimensions, value => $$invalidate(12, $dimensions = value));
    	let { value } = $$props;
    	let { rank } = $$props;
    	let { fill } = $$props;
    	const writable_props = ["value", "rank", "fill"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Chart_Bar> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("value" in $$props) $$invalidate(6, value = $$props.value);
    		if ("rank" in $$props) $$invalidate(7, rank = $$props.rank);
    		if ("fill" in $$props) $$invalidate(8, fill = $$props.fill);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		scales,
    		dimensions,
    		value,
    		rank,
    		fill,
    		borderWidth,
    		w,
    		$scales,
    		y,
    		$dimensions,
    		barColor,
    		transform,
    		width,
    		height
    	});

    	$$self.$inject_state = $$props => {
    		if ("value" in $$props) $$invalidate(6, value = $$props.value);
    		if ("rank" in $$props) $$invalidate(7, rank = $$props.rank);
    		if ("fill" in $$props) $$invalidate(8, fill = $$props.fill);
    		if ("w" in $$props) $$invalidate(9, w = $$props.w);
    		if ("y" in $$props) $$invalidate(11, y = $$props.y);
    		if ("barColor" in $$props) $$invalidate(0, barColor = $$props.barColor);
    		if ("transform" in $$props) $$invalidate(1, transform = $$props.transform);
    		if ("width" in $$props) $$invalidate(2, width = $$props.width);
    		if ("height" in $$props) $$invalidate(3, height = $$props.height);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$scales, value*/ 1088) {
    			$$invalidate(9, w = $scales.x(value) || 0);
    		}

    		if ($$self.$$.dirty & /*$scales, rank, $dimensions*/ 5248) {
    			$$invalidate(11, y = ($scales.y(rank) || 0) + $dimensions.barMargin / 2);
    		}

    		if ($$self.$$.dirty & /*fill*/ 256) {
    			$$invalidate(0, barColor = `--bar-color: ${fill};`);
    		}

    		if ($$self.$$.dirty & /*y*/ 2048) {
    			$$invalidate(1, transform = `transform: translateY(${y}px);`);
    		}

    		if ($$self.$$.dirty & /*w*/ 512) {
    			$$invalidate(2, width = `width: ${w - borderWidth}px;`);
    		}

    		if ($$self.$$.dirty & /*$dimensions*/ 4096) {
    			$$invalidate(3, height = `height: ${$dimensions.barHeight || 0}px;`);
    		}
    	};

    	return [
    		barColor,
    		transform,
    		width,
    		height,
    		scales,
    		dimensions,
    		value,
    		rank,
    		fill,
    		w,
    		$scales,
    		y,
    		$dimensions
    	];
    }

    class Chart_Bar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { value: 6, rank: 7, fill: 8 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Chart_Bar",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*value*/ ctx[6] === undefined && !("value" in props)) {
    			console.warn("<Chart_Bar> was created without expected prop 'value'");
    		}

    		if (/*rank*/ ctx[7] === undefined && !("rank" in props)) {
    			console.warn("<Chart_Bar> was created without expected prop 'rank'");
    		}

    		if (/*fill*/ ctx[8] === undefined && !("fill" in props)) {
    			console.warn("<Chart_Bar> was created without expected prop 'fill'");
    		}
    	}

    	get value() {
    		throw new Error("<Chart_Bar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Chart_Bar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get rank() {
    		throw new Error("<Chart_Bar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rank(value) {
    		throw new Error("<Chart_Bar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fill() {
    		throw new Error("<Chart_Bar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fill(value) {
    		throw new Error("<Chart_Bar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var colors = [
    	"#FFDE6B",
    	"#EF89EE",
    	"#F79F1E",
    	"#BDB76B",
    	"#9F84EC",
    	"#32CD32",
    	"#40E0D0",
    	"#FF7F50",
    	"#A2CB39",
    	"#FF6E2F",
    	"#FEB8B9",
    	"#af7aa1",
    	"#7EFFF5"
    ];

    /* src\Chart.Bars.svelte generated by Svelte v3.37.0 */

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i].value;
    	child_ctx[5] = list[i].rank;
    	child_ctx[7] = i;
    	return child_ctx;
    }

    // (13:2) {#if rank < barCount}
    function create_if_block$3(ctx) {
    	let bar;
    	let current;

    	bar = new Chart_Bar({
    			props: {
    				value: /*value*/ ctx[4],
    				rank: /*rank*/ ctx[5],
    				fill: colors[/*i*/ ctx[7] % /*colorCount*/ ctx[3]]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(bar.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(bar, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const bar_changes = {};
    			if (dirty & /*$data*/ 2) bar_changes.value = /*value*/ ctx[4];
    			if (dirty & /*$data*/ 2) bar_changes.rank = /*rank*/ ctx[5];
    			if (dirty & /*$data*/ 2) bar_changes.fill = colors[/*i*/ ctx[7] % /*colorCount*/ ctx[3]];
    			bar.$set(bar_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(bar.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(bar.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(bar, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(13:2) {#if rank < barCount}",
    		ctx
    	});

    	return block;
    }

    // (12:0) {#each $data as { value, rank }
    function create_each_block$2(key_1, ctx) {
    	let first;
    	let if_block_anchor;
    	let current;
    	let if_block = /*rank*/ ctx[5] < /*barCount*/ ctx[0] && create_if_block$3(ctx);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (/*rank*/ ctx[5] < /*barCount*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*$data, barCount*/ 3) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(12:0) {#each $data as { value, rank }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_1_anchor;
    	let current;
    	let each_value = /*$data*/ ctx[1];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*i*/ ctx[7];
    	validate_each_keys(ctx, each_value, get_each_context$2, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$2(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$2(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$data, colors, colorCount, barCount*/ 11) {
    				each_value = /*$data*/ ctx[1];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context$2, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, each_1_anchor.parentNode, outro_and_destroy_block, create_each_block$2, each_1_anchor, get_each_context$2);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let $data;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Chart_Bars", slots, []);
    	const { data } = getContext("Chart");
    	validate_store(data, "data");
    	component_subscribe($$self, data, value => $$invalidate(1, $data = value));
    	const colorCount = colors.length;
    	let { barCount } = $$props;
    	const writable_props = ["barCount"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Chart_Bars> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("barCount" in $$props) $$invalidate(0, barCount = $$props.barCount);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		Bar: Chart_Bar,
    		colors,
    		data,
    		colorCount,
    		barCount,
    		$data
    	});

    	$$self.$inject_state = $$props => {
    		if ("barCount" in $$props) $$invalidate(0, barCount = $$props.barCount);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [barCount, $data, data, colorCount];
    }

    class Chart_Bars extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { barCount: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Chart_Bars",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*barCount*/ ctx[0] === undefined && !("barCount" in props)) {
    			console.warn("<Chart_Bars> was created without expected prop 'barCount'");
    		}
    	}

    	get barCount() {
    		throw new Error("<Chart_Bars>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set barCount(value) {
    		throw new Error("<Chart_Bars>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function fade(node, { delay = 0, duration = 400, easing = identity$2 } = {}) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }

    /* src\Chart.Tick.svelte generated by Svelte v3.37.0 */
    const file$4 = "src\\Chart.Tick.svelte";

    function create_fragment$6(ctx) {
    	let div1;
    	let div0;
    	let t0;
    	let p;
    	let t1;
    	let div1_transition;
    	let current;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t0 = space();
    			p = element("p");
    			t1 = text(/*formattedValue*/ ctx[1]);
    			attr_dev(div0, "class", "line svelte-rmzpe0");
    			add_location(div0, file$4, 17, 2, 373);
    			attr_dev(p, "class", "value svelte-rmzpe0");
    			add_location(p, file$4, 18, 2, 401);
    			attr_dev(div1, "class", "tick svelte-rmzpe0");
    			set_style(div1, "transform", "translate(" + /*x*/ ctx[0] + "px, 0)");
    			add_location(div1, file$4, 12, 0, 267);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div1, t0);
    			append_dev(div1, p);
    			append_dev(p, t1);
    			current = true;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			if (!current || dirty & /*formattedValue*/ 2) set_data_dev(t1, /*formattedValue*/ ctx[1]);

    			if (!current || dirty & /*x*/ 1) {
    				set_style(div1, "transform", "translate(" + /*x*/ ctx[0] + "px, 0)");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, { duration: duration$1 }, true);
    				div1_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, { duration: duration$1 }, false);
    			div1_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (detaching && div1_transition) div1_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const duration$1 = 250;

    function instance$6($$self, $$props, $$invalidate) {
    	let formattedValue;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Chart_Tick", slots, []);
    	let { value } = $$props;
    	let { x } = $$props;
    	const formatNumber = d => format(",.0f")(d) + "%";
    	const writable_props = ["value", "x"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Chart_Tick> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("value" in $$props) $$invalidate(2, value = $$props.value);
    		if ("x" in $$props) $$invalidate(0, x = $$props.x);
    	};

    	$$self.$capture_state = () => ({
    		format,
    		fade,
    		value,
    		x,
    		duration: duration$1,
    		formatNumber,
    		formattedValue
    	});

    	$$self.$inject_state = $$props => {
    		if ("value" in $$props) $$invalidate(2, value = $$props.value);
    		if ("x" in $$props) $$invalidate(0, x = $$props.x);
    		if ("formattedValue" in $$props) $$invalidate(1, formattedValue = $$props.formattedValue);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*value*/ 4) {
    			$$invalidate(1, formattedValue = formatNumber(value));
    		}
    	};

    	return [x, formattedValue, value];
    }

    class Chart_Tick extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { value: 2, x: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Chart_Tick",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*value*/ ctx[2] === undefined && !("value" in props)) {
    			console.warn("<Chart_Tick> was created without expected prop 'value'");
    		}

    		if (/*x*/ ctx[0] === undefined && !("x" in props)) {
    			console.warn("<Chart_Tick> was created without expected prop 'x'");
    		}
    	}

    	get value() {
    		throw new Error("<Chart_Tick>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Chart_Tick>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get x() {
    		throw new Error("<Chart_Tick>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set x(value) {
    		throw new Error("<Chart_Tick>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Chart.Axis.svelte generated by Svelte v3.37.0 */

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (9:0) {#each ticks as value (value)}
    function create_each_block$1(key_1, ctx) {
    	let first;
    	let tick_1;
    	let current;

    	tick_1 = new Chart_Tick({
    			props: {
    				x: /*$scales*/ ctx[0].x(/*value*/ ctx[3]),
    				value: /*value*/ ctx[3]
    			},
    			$$inline: true
    		});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(tick_1.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(tick_1, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const tick_1_changes = {};
    			if (dirty & /*$scales, ticks*/ 3) tick_1_changes.x = /*$scales*/ ctx[0].x(/*value*/ ctx[3]);
    			if (dirty & /*ticks*/ 2) tick_1_changes.value = /*value*/ ctx[3];
    			tick_1.$set(tick_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tick_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tick_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(tick_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(9:0) {#each ticks as value (value)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_1_anchor;
    	let current;
    	let each_value = /*ticks*/ ctx[1];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*value*/ ctx[3];
    	validate_each_keys(ctx, each_value, get_each_context$1, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$1(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$1(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$scales, ticks*/ 3) {
    				each_value = /*ticks*/ ctx[1];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context$1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, each_1_anchor.parentNode, outro_and_destroy_block, create_each_block$1, each_1_anchor, get_each_context$1);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let ticks;
    	let $scales;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Chart_Axis", slots, []);
    	const { scales } = getContext("Chart");
    	validate_store(scales, "scales");
    	component_subscribe($$self, scales, value => $$invalidate(0, $scales = value));
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Chart_Axis> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ getContext, Tick: Chart_Tick, scales, ticks, $scales });

    	$$self.$inject_state = $$props => {
    		if ("ticks" in $$props) $$invalidate(1, ticks = $$props.ticks);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$scales*/ 1) {
    			$$invalidate(1, ticks = $scales.x.ticks(5).slice(1)); // don't need to show 0
    		}
    	};

    	return [$scales, ticks, scales];
    }

    class Chart_Axis extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Chart_Axis",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\Chart.Label.svelte generated by Svelte v3.37.0 */
    const file$3 = "src\\Chart.Label.svelte";

    function create_fragment$4(ctx) {
    	let div;
    	let p0;
    	let t0_value = /*names*/ ctx[4][/*i*/ ctx[1]] + "";
    	let t0;
    	let t1;
    	let p1;
    	let t2_value = /*formatNumber*/ ctx[7](/*value*/ ctx[0]) + "";
    	let t2;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p0 = element("p");
    			t0 = text(t0_value);
    			t1 = space();
    			p1 = element("p");
    			t2 = text(t2_value);
    			attr_dev(p0, "class", "name svelte-1ilfmkp");
    			add_location(p0, file$3, 19, 2, 517);
    			attr_dev(p1, "class", "value svelte-1ilfmkp");
    			add_location(p1, file$3, 20, 2, 551);
    			set_style(div, "position", "absolute");
    			set_style(div, "top", /*y*/ ctx[3] + "px");
    			set_style(div, "left", /*x*/ ctx[2] + 5 + "px");
    			add_location(div, file$3, 17, 0, 449);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p0);
    			append_dev(p0, t0);
    			append_dev(div, t1);
    			append_dev(div, p1);
    			append_dev(p1, t2);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*i*/ 2 && t0_value !== (t0_value = /*names*/ ctx[4][/*i*/ ctx[1]] + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*value*/ 1 && t2_value !== (t2_value = /*formatNumber*/ ctx[7](/*value*/ ctx[0]) + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*y*/ 8) {
    				set_style(div, "top", /*y*/ ctx[3] + "px");
    			}

    			if (dirty & /*x*/ 4) {
    				set_style(div, "left", /*x*/ ctx[2] + 5 + "px");
    			}
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let x;
    	let y;
    	let height;
    	let $scales;
    	let $dimensions;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Chart_Label", slots, []);
    	let { value } = $$props;
    	let { rank } = $$props;
    	let { i } = $$props;
    	const { names, scales, dimensions } = getContext("Chart");
    	validate_store(scales, "scales");
    	component_subscribe($$self, scales, value => $$invalidate(9, $scales = value));
    	validate_store(dimensions, "dimensions");
    	component_subscribe($$self, dimensions, value => $$invalidate(10, $dimensions = value));
    	const formatNumber = d => format(",.1f")(d) + "%";
    	const writable_props = ["value", "rank", "i"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Chart_Label> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("rank" in $$props) $$invalidate(8, rank = $$props.rank);
    		if ("i" in $$props) $$invalidate(1, i = $$props.i);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		format,
    		value,
    		rank,
    		i,
    		names,
    		scales,
    		dimensions,
    		formatNumber,
    		x,
    		$scales,
    		y,
    		$dimensions,
    		height
    	});

    	$$self.$inject_state = $$props => {
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("rank" in $$props) $$invalidate(8, rank = $$props.rank);
    		if ("i" in $$props) $$invalidate(1, i = $$props.i);
    		if ("x" in $$props) $$invalidate(2, x = $$props.x);
    		if ("y" in $$props) $$invalidate(3, y = $$props.y);
    		if ("height" in $$props) height = $$props.height;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$scales, value*/ 513) {
    			$$invalidate(2, x = $scales.x(value));
    		}

    		if ($$self.$$.dirty & /*$scales, rank, $dimensions*/ 1792) {
    			$$invalidate(3, y = $scales.y(rank) + $dimensions.barMargin / 2);
    		}

    		if ($$self.$$.dirty & /*$dimensions*/ 1024) {
    			height = $dimensions.barHeight;
    		}
    	};

    	return [
    		value,
    		i,
    		x,
    		y,
    		names,
    		scales,
    		dimensions,
    		formatNumber,
    		rank,
    		$scales,
    		$dimensions
    	];
    }

    class Chart_Label extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { value: 0, rank: 8, i: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Chart_Label",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*value*/ ctx[0] === undefined && !("value" in props)) {
    			console.warn("<Chart_Label> was created without expected prop 'value'");
    		}

    		if (/*rank*/ ctx[8] === undefined && !("rank" in props)) {
    			console.warn("<Chart_Label> was created without expected prop 'rank'");
    		}

    		if (/*i*/ ctx[1] === undefined && !("i" in props)) {
    			console.warn("<Chart_Label> was created without expected prop 'i'");
    		}
    	}

    	get value() {
    		throw new Error("<Chart_Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Chart_Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get rank() {
    		throw new Error("<Chart_Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rank(value) {
    		throw new Error("<Chart_Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get i() {
    		throw new Error("<Chart_Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set i(value) {
    		throw new Error("<Chart_Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Chart.Labels.svelte generated by Svelte v3.37.0 */

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i].value;
    	child_ctx[4] = list[i].rank;
    	child_ctx[6] = i;
    	return child_ctx;
    }

    // (10:2) {#if rank < maxRank}
    function create_if_block$2(ctx) {
    	let label;
    	let current;

    	label = new Chart_Label({
    			props: {
    				value: /*value*/ ctx[3],
    				rank: /*rank*/ ctx[4],
    				i: /*i*/ ctx[6]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(label.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(label, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const label_changes = {};
    			if (dirty & /*$data*/ 2) label_changes.value = /*value*/ ctx[3];
    			if (dirty & /*$data*/ 2) label_changes.rank = /*rank*/ ctx[4];
    			if (dirty & /*$data*/ 2) label_changes.i = /*i*/ ctx[6];
    			label.$set(label_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(label.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(label.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(label, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(10:2) {#if rank < maxRank}",
    		ctx
    	});

    	return block;
    }

    // (9:0) {#each $data as { value, rank }
    function create_each_block(key_1, ctx) {
    	let first;
    	let if_block_anchor;
    	let current;
    	let if_block = /*rank*/ ctx[4] < /*maxRank*/ ctx[0] && create_if_block$2(ctx);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (/*rank*/ ctx[4] < /*maxRank*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*$data, maxRank*/ 3) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(9:0) {#each $data as { value, rank }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_1_anchor;
    	let current;
    	let each_value = /*$data*/ ctx[1];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*i*/ ctx[6];
    	validate_each_keys(ctx, each_value, get_each_context, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$data, maxRank*/ 3) {
    				each_value = /*$data*/ ctx[1];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, each_1_anchor.parentNode, outro_and_destroy_block, create_each_block, each_1_anchor, get_each_context);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $data;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Chart_Labels", slots, []);
    	const { data } = getContext("Chart");
    	validate_store(data, "data");
    	component_subscribe($$self, data, value => $$invalidate(1, $data = value));
    	let { maxRank = 10 } = $$props;
    	const writable_props = ["maxRank"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Chart_Labels> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("maxRank" in $$props) $$invalidate(0, maxRank = $$props.maxRank);
    	};

    	$$self.$capture_state = () => ({ getContext, Label: Chart_Label, data, maxRank, $data });

    	$$self.$inject_state = $$props => {
    		if ("maxRank" in $$props) $$invalidate(0, maxRank = $$props.maxRank);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [maxRank, $data, data];
    }

    class Chart_Labels extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { maxRank: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Chart_Labels",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get maxRank() {
    		throw new Error("<Chart_Labels>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set maxRank(value) {
    		throw new Error("<Chart_Labels>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Chart.Ticker.svelte generated by Svelte v3.37.0 */
    const file$2 = "src\\Chart.Ticker.svelte";

    // (8:0) {#if date}
    function create_if_block$1(ctx) {
    	let p;
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(/*year*/ ctx[1]);
    			attr_dev(p, "class", "svelte-1kyb6o1");
    			add_location(p, file$2, 8, 2, 150);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*year*/ 2) set_data_dev(t, /*year*/ ctx[1]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(8:0) {#if date}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let if_block_anchor;
    	let if_block = /*date*/ ctx[0] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*date*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop$1,
    		o: noop$1,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let year;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Chart_Ticker", slots, []);
    	let { date } = $$props;
    	const writable_props = ["date"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Chart_Ticker> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("date" in $$props) $$invalidate(0, date = $$props.date);
    	};

    	$$self.$capture_state = () => ({ timeParse, date, year });

    	$$self.$inject_state = $$props => {
    		if ("date" in $$props) $$invalidate(0, date = $$props.date);
    		if ("year" in $$props) $$invalidate(1, year = $$props.year);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*date*/ 1) {
    			$$invalidate(1, year = timeParse("%m-%d-%Y")(date).getFullYear());
    		}
    	};

    	return [date, year];
    }

    class Chart_Ticker extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { date: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Chart_Ticker",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*date*/ ctx[0] === undefined && !("date" in props)) {
    			console.warn("<Chart_Ticker> was created without expected prop 'date'");
    		}
    	}

    	get date() {
    		throw new Error("<Chart_Ticker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set date(value) {
    		throw new Error("<Chart_Ticker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var keyframes = [
    	[
    		"12-31-1989",
    		[
    			{
    				name: "Coal",
    				value: 32.856228571428574,
    				rank: 0
    			},
    			{
    				name: "Hydro",
    				value: 21.6436,
    				rank: 1
    			},
    			{
    				name: "Oil",
    				value: 18.77622857142857,
    				rank: 2
    			},
    			{
    				name: "Nuclear",
    				value: 16.595914285714287,
    				rank: 3
    			},
    			{
    				name: "Gas",
    				value: 9.221857142857145,
    				rank: 4
    			},
    			{
    				name: "Biofuel",
    				value: 0.5946285714285714,
    				rank: 5
    			},
    			{
    				name: "Wind",
    				value: 0.0707428571428571,
    				rank: 6
    			},
    			{
    				name: "Solar",
    				value: 0.0002,
    				rank: 7
    			}
    		]
    	],
    	[
    		"12-31-1990",
    		[
    			{
    				name: "Coal",
    				value: 31.38911428571428,
    				rank: 0
    			},
    			{
    				name: "Hydro",
    				value: 22.808885714285715,
    				rank: 1
    			},
    			{
    				name: "Oil",
    				value: 19.06317142857143,
    				rank: 2
    			},
    			{
    				name: "Nuclear",
    				value: 16.559885714285713,
    				rank: 3
    			},
    			{
    				name: "Gas",
    				value: 9.303285714285714,
    				rank: 4
    			},
    			{
    				name: "Biofuel",
    				value: 0.5851714285714286,
    				rank: 5
    			},
    			{
    				name: "Wind",
    				value: 0.0633428571428571,
    				rank: 6
    			},
    			{
    				name: "Solar",
    				value: 0.0001714285714285,
    				rank: 7
    			}
    		]
    	],
    	[
    		"12-31-1991",
    		[
    			{
    				name: "Coal",
    				value: 31.836285714285715,
    				rank: 0
    			},
    			{
    				name: "Hydro",
    				value: 22.62642857142857,
    				rank: 1
    			},
    			{
    				name: "Oil",
    				value: 19.2086,
    				rank: 2
    			},
    			{
    				name: "Nuclear",
    				value: 16.8864,
    				rank: 3
    			},
    			{
    				name: "Gas",
    				value: 8.528114285714285,
    				rank: 4
    			},
    			{
    				name: "Biofuel",
    				value: 0.6222285714285714,
    				rank: 5
    			},
    			{
    				name: "Wind",
    				value: 0.0965714285714285,
    				rank: 6
    			},
    			{
    				name: "Solar",
    				value: 0.0002857142857142,
    				rank: 7
    			}
    		]
    	],
    	[
    		"12-31-1992",
    		[
    			{
    				name: "Coal",
    				value: 31.051457142857146,
    				rank: 0
    			},
    			{
    				name: "Hydro",
    				value: 23.3786,
    				rank: 1
    			},
    			{
    				name: "Oil",
    				value: 18.73014285714285,
    				rank: 2
    			},
    			{
    				name: "Nuclear",
    				value: 17.531914285714283,
    				rank: 3
    			},
    			{
    				name: "Gas",
    				value: 8.3092,
    				rank: 4
    			},
    			{
    				name: "Biofuel",
    				value: 0.6786,
    				rank: 5
    			},
    			{
    				name: "Wind",
    				value: 0.1087428571428571,
    				rank: 6
    			},
    			{
    				name: "Solar",
    				value: 0.0003142857142857,
    				rank: 7
    			}
    		]
    	],
    	[
    		"12-31-1993",
    		[
    			{
    				name: "Coal",
    				value: 30.1518,
    				rank: 0
    			},
    			{
    				name: "Hydro",
    				value: 24.00362857142857,
    				rank: 1
    			},
    			{
    				name: "Oil",
    				value: 18.48308571428572,
    				rank: 2
    			},
    			{
    				name: "Nuclear",
    				value: 17.481,
    				rank: 3
    			},
    			{
    				name: "Gas",
    				value: 8.82237142857143,
    				rank: 4
    			},
    			{
    				name: "Biofuel",
    				value: 0.7372,
    				rank: 5
    			},
    			{
    				name: "Wind",
    				value: 0.1133142857142857,
    				rank: 6
    			},
    			{
    				name: "Solar",
    				value: 0.0003428571428571,
    				rank: 7
    			}
    		]
    	],
    	[
    		"12-31-1994",
    		[
    			{
    				name: "Coal",
    				value: 29.265257142857145,
    				rank: 0
    			},
    			{
    				name: "Hydro",
    				value: 23.94048571428572,
    				rank: 1
    			},
    			{
    				name: "Oil",
    				value: 18.482142857142858,
    				rank: 2
    			},
    			{
    				name: "Nuclear",
    				value: 17.468228571428572,
    				rank: 3
    			},
    			{
    				name: "Gas",
    				value: 9.656,
    				rank: 4
    			},
    			{
    				name: "Biofuel",
    				value: 0.8397714285714285,
    				rank: 5
    			},
    			{
    				name: "Wind",
    				value: 0.1304285714285714,
    				rank: 6
    			},
    			{
    				name: "Solar",
    				value: 0.0005142857142857,
    				rank: 7
    			}
    		]
    	],
    	[
    		"12-31-1995",
    		[
    			{
    				name: "Coal",
    				value: 27.965,
    				rank: 0
    			},
    			{
    				name: "Hydro",
    				value: 24.14877142857143,
    				rank: 1
    			},
    			{
    				name: "Oil",
    				value: 17.972971428571427,
    				rank: 2
    			},
    			{
    				name: "Nuclear",
    				value: 17.849457142857144,
    				rank: 3
    			},
    			{
    				name: "Gas",
    				value: 10.925371428571427,
    				rank: 4
    			},
    			{
    				name: "Biofuel",
    				value: 0.777,
    				rank: 5
    			},
    			{
    				name: "Wind",
    				value: 0.1112857142857142,
    				rank: 6
    			},
    			{
    				name: "Solar",
    				value: 0.0005142857142857,
    				rank: 7
    			}
    		]
    	],
    	[
    		"12-31-1996",
    		[
    			{
    				name: "Coal",
    				value: 27.557114285714288,
    				rank: 0
    			},
    			{
    				name: "Hydro",
    				value: 23.84197142857143,
    				rank: 1
    			},
    			{
    				name: "Nuclear",
    				value: 17.970085714285712,
    				rank: 2
    			},
    			{
    				name: "Oil",
    				value: 17.67591428571429,
    				rank: 3
    			},
    			{
    				name: "Gas",
    				value: 11.567628571428571,
    				rank: 4
    			},
    			{
    				name: "Biofuel",
    				value: 0.9443142857142858,
    				rank: 5
    			},
    			{
    				name: "Wind",
    				value: 0.1935714285714286,
    				rank: 6
    			},
    			{
    				name: "Solar",
    				value: 0.0005428571428571,
    				rank: 7
    			}
    		]
    	],
    	[
    		"12-31-1997",
    		[
    			{
    				name: "Coal",
    				value: 26.582,
    				rank: 0
    			},
    			{
    				name: "Hydro",
    				value: 24.582571428571427,
    				rank: 1
    			},
    			{
    				name: "Nuclear",
    				value: 17.549657142857143,
    				rank: 2
    			},
    			{
    				name: "Oil",
    				value: 17.339114285714288,
    				rank: 3
    			},
    			{
    				name: "Gas",
    				value: 12.165228571428573,
    				rank: 4
    			},
    			{
    				name: "Biofuel",
    				value: 1.0364285714285717,
    				rank: 5
    			},
    			{
    				name: "Wind",
    				value: 0.3908,
    				rank: 6
    			},
    			{
    				name: "Solar",
    				value: 0.0007142857142857,
    				rank: 7
    			}
    		]
    	],
    	[
    		"12-31-1998",
    		[
    			{
    				name: "Coal",
    				value: 25.55645714285714,
    				rank: 0
    			},
    			{
    				name: "Hydro",
    				value: 23.72377142857143,
    				rank: 1
    			},
    			{
    				name: "Nuclear",
    				value: 17.554714285714283,
    				rank: 2
    			},
    			{
    				name: "Oil",
    				value: 16.958971428571427,
    				rank: 3
    			},
    			{
    				name: "Gas",
    				value: 14.11442857142857,
    				rank: 4
    			},
    			{
    				name: "Biofuel",
    				value: 1.0434857142857143,
    				rank: 5
    			},
    			{
    				name: "Wind",
    				value: 0.5352571428571429,
    				rank: 6
    			},
    			{
    				name: "Solar",
    				value: 0.0011428571428571,
    				rank: 7
    			}
    		]
    	],
    	[
    		"12-31-1999",
    		[
    			{
    				name: "Oil",
    				value: 37.90523963133641,
    				rank: 0
    			},
    			{
    				name: "Hydro",
    				value: 28.07302304147465,
    				rank: 1
    			},
    			{
    				name: "Gas",
    				value: 14.13772811059908,
    				rank: 2
    			},
    			{
    				name: "Coal",
    				value: 12.988345622119816,
    				rank: 3
    			},
    			{
    				name: "Nuclear",
    				value: 4.827359447004609,
    				rank: 4
    			},
    			{
    				name: "Biofuel",
    				value: 1.2603502304147465,
    				rank: 5
    			},
    			{
    				name: "Wind",
    				value: 0.1945668202764977,
    				rank: 6
    			},
    			{
    				name: "Solar",
    				value: 0.0017419354838709,
    				rank: 7
    			}
    		]
    	],
    	[
    		"12-31-2000",
    		[
    			{
    				name: "Oil",
    				value: 37.4482247706422,
    				rank: 0
    			},
    			{
    				name: "Hydro",
    				value: 27.43346330275229,
    				rank: 1
    			},
    			{
    				name: "Gas",
    				value: 15.10362385321101,
    				rank: 2
    			},
    			{
    				name: "Coal",
    				value: 13.080619266055049,
    				rank: 3
    			},
    			{
    				name: "Nuclear",
    				value: 4.889733944954129,
    				rank: 4
    			},
    			{
    				name: "Biofuel",
    				value: 1.2198073394495412,
    				rank: 5
    			},
    			{
    				name: "Wind",
    				value: 0.1967018348623853,
    				rank: 6
    			},
    			{
    				name: "Solar",
    				value: 0.0020045871559633,
    				rank: 7
    			}
    		]
    	],
    	[
    		"12-31-2001",
    		[
    			{
    				name: "Oil",
    				value: 37.285573394495415,
    				rank: 0
    			},
    			{
    				name: "Hydro",
    				value: 27.651912844036698,
    				rank: 1
    			},
    			{
    				name: "Gas",
    				value: 15.130344036697249,
    				rank: 2
    			},
    			{
    				name: "Coal",
    				value: 12.938674311926604,
    				rank: 3
    			},
    			{
    				name: "Nuclear",
    				value: 4.962798165137615,
    				rank: 4
    			},
    			{
    				name: "Biofuel",
    				value: 1.2125412844036698,
    				rank: 5
    			},
    			{
    				name: "Wind",
    				value: 0.2189128440366972,
    				rank: 6
    			},
    			{
    				name: "Solar",
    				value: 0.0023211009174311,
    				rank: 7
    			}
    		]
    	],
    	[
    		"12-31-2002",
    		[
    			{
    				name: "Oil",
    				value: 37.61981278538813,
    				rank: 0
    			},
    			{
    				name: "Hydro",
    				value: 27.04829223744292,
    				rank: 1
    			},
    			{
    				name: "Gas",
    				value: 15.281415525114156,
    				rank: 2
    			},
    			{
    				name: "Coal",
    				value: 13.04880821917808,
    				rank: 3
    			},
    			{
    				name: "Nuclear",
    				value: 4.824374429223744,
    				rank: 4
    			},
    			{
    				name: "Biofuel",
    				value: 1.3107077625570778,
    				rank: 5
    			},
    			{
    				name: "Wind",
    				value: 0.2272191780821918,
    				rank: 6
    			},
    			{
    				name: "Solar",
    				value: 0.0025388127853881,
    				rank: 7
    			}
    		]
    	],
    	[
    		"12-31-2003",
    		[
    			{
    				name: "Oil",
    				value: 37.23172602739726,
    				rank: 0
    			},
    			{
    				name: "Hydro",
    				value: 27.08230136986301,
    				rank: 1
    			},
    			{
    				name: "Gas",
    				value: 15.701328767123288,
    				rank: 2
    			},
    			{
    				name: "Coal",
    				value: 12.739228310502284,
    				rank: 3
    			},
    			{
    				name: "Nuclear",
    				value: 4.8316849315068495,
    				rank: 4
    			},
    			{
    				name: "Biofuel",
    				value: 1.4334200913242008,
    				rank: 5
    			},
    			{
    				name: "Wind",
    				value: 0.3255662100456621,
    				rank: 6
    			},
    			{
    				name: "Solar",
    				value: 0.0043972602739726,
    				rank: 7
    			}
    		]
    	],
    	[
    		"12-31-2004",
    		[
    			{
    				name: "Oil",
    				value: 37.126768181818186,
    				rank: 0
    			},
    			{
    				name: "Hydro",
    				value: 26.74974090909091,
    				rank: 1
    			},
    			{
    				name: "Gas",
    				value: 15.974368181818182,
    				rank: 2
    			},
    			{
    				name: "Coal",
    				value: 12.763218181818182,
    				rank: 3
    			},
    			{
    				name: "Nuclear",
    				value: 4.76484090909091,
    				rank: 4
    			},
    			{
    				name: "Biofuel",
    				value: 1.5637318181818185,
    				rank: 5
    			},
    			{
    				name: "Wind",
    				value: 0.3841272727272727,
    				rank: 6
    			},
    			{
    				name: "Solar",
    				value: 0.0068363636363636,
    				rank: 7
    			}
    		]
    	],
    	[
    		"12-31-2005",
    		[
    			{
    				name: "Oil",
    				value: 37.10441363636363,
    				rank: 0
    			},
    			{
    				name: "Hydro",
    				value: 26.18748181818182,
    				rank: 1
    			},
    			{
    				name: "Gas",
    				value: 16.533645454545454,
    				rank: 2
    			},
    			{
    				name: "Coal",
    				value: 12.800195454545456,
    				rank: 3
    			},
    			{
    				name: "Nuclear",
    				value: 4.717127272727273,
    				rank: 4
    			},
    			{
    				name: "Biofuel",
    				value: 1.5278318181818182,
    				rank: 5
    			},
    			{
    				name: "Wind",
    				value: 0.4228363636363636,
    				rank: 6
    			},
    			{
    				name: "Solar",
    				value: 0.0113045454545454,
    				rank: 7
    			}
    		]
    	],
    	[
    		"12-31-2006",
    		[
    			{
    				name: "Oil",
    				value: 36.843190909090914,
    				rank: 0
    			},
    			{
    				name: "Hydro",
    				value: 25.993409090909093,
    				rank: 1
    			},
    			{
    				name: "Gas",
    				value: 16.902431818181817,
    				rank: 2
    			},
    			{
    				name: "Coal",
    				value: 12.927918181818182,
    				rank: 3
    			},
    			{
    				name: "Nuclear",
    				value: 4.551709090909091,
    				rank: 4
    			},
    			{
    				name: "Biofuel",
    				value: 1.4963772727272726,
    				rank: 5
    			},
    			{
    				name: "Wind",
    				value: 0.5391363636363636,
    				rank: 6
    			},
    			{
    				name: "Solar",
    				value: 0.0155272727272727,
    				rank: 7
    			}
    		]
    	],
    	[
    		"12-31-2007",
    		[
    			{
    				name: "Oil",
    				value: 36.568481818181816,
    				rank: 0
    			},
    			{
    				name: "Hydro",
    				value: 26.185240909090908,
    				rank: 1
    			},
    			{
    				name: "Gas",
    				value: 17.076172727272727,
    				rank: 2
    			},
    			{
    				name: "Coal",
    				value: 12.621163636363637,
    				rank: 3
    			},
    			{
    				name: "Nuclear",
    				value: 4.5805181818181815,
    				rank: 4
    			},
    			{
    				name: "Biofuel",
    				value: 1.5936727272727274,
    				rank: 5
    			},
    			{
    				name: "Wind",
    				value: 0.6059681818181818,
    				rank: 6
    			},
    			{
    				name: "Solar",
    				value: 0.0259454545454545,
    				rank: 7
    			}
    		]
    	],
    	[
    		"12-31-2008",
    		[
    			{
    				name: "Oil",
    				value: 36.61092272727273,
    				rank: 0
    			},
    			{
    				name: "Hydro",
    				value: 26.369886363636365,
    				rank: 1
    			},
    			{
    				name: "Gas",
    				value: 17.013954545454546,
    				rank: 2
    			},
    			{
    				name: "Coal",
    				value: 12.033481818181818,
    				rank: 3
    			},
    			{
    				name: "Nuclear",
    				value: 4.626259090909091,
    				rank: 4
    			},
    			{
    				name: "Biofuel",
    				value: 1.7672681818181817,
    				rank: 5
    			},
    			{
    				name: "Wind",
    				value: 0.7640136363636364,
    				rank: 6
    			},
    			{
    				name: "Solar",
    				value: 0.0447272727272727,
    				rank: 7
    			}
    		]
    	],
    	[
    		"12-31-2009",
    		[
    			{
    				name: "Oil",
    				value: 35.55754794520548,
    				rank: 0
    			},
    			{
    				name: "Hydro",
    				value: 26.908712328767123,
    				rank: 1
    			},
    			{
    				name: "Gas",
    				value: 17.99909132420091,
    				rank: 2
    			},
    			{
    				name: "Coal",
    				value: 11.78117808219178,
    				rank: 3
    			},
    			{
    				name: "Nuclear",
    				value: 4.154680365296803,
    				rank: 4
    			},
    			{
    				name: "Biofuel",
    				value: 1.8710228310502284,
    				rank: 5
    			},
    			{
    				name: "Wind",
    				value: 0.8762374429223744,
    				rank: 6
    			},
    			{
    				name: "Solar",
    				value: 0.0990958904109589,
    				rank: 7
    			}
    		]
    	],
    	[
    		"12-31-2010",
    		[
    			{
    				name: "Oil",
    				value: 35.205333333333336,
    				rank: 0
    			},
    			{
    				name: "Hydro",
    				value: 26.22026484018265,
    				rank: 1
    			},
    			{
    				name: "Gas",
    				value: 17.784045662100457,
    				rank: 2
    			},
    			{
    				name: "Coal",
    				value: 12.29958904109589,
    				rank: 3
    			},
    			{
    				name: "Nuclear",
    				value: 4.149141552511416,
    				rank: 4
    			},
    			{
    				name: "Biofuel",
    				value: 1.996013698630137,
    				rank: 5
    			},
    			{
    				name: "Wind",
    				value: 1.3774292237442922,
    				rank: 6
    			},
    			{
    				name: "Solar",
    				value: 0.2222100456621004,
    				rank: 7
    			}
    		]
    	],
    	[
    		"12-31-2011",
    		[
    			{
    				name: "Oil",
    				value: 34.655939814814815,
    				rank: 0
    			},
    			{
    				name: "Hydro",
    				value: 26.03783796296296,
    				rank: 1
    			},
    			{
    				name: "Gas",
    				value: 18.01900462962963,
    				rank: 2
    			},
    			{
    				name: "Coal",
    				value: 12.32989351851852,
    				rank: 3
    			},
    			{
    				name: "Nuclear",
    				value: 4.078337962962963,
    				rank: 4
    			},
    			{
    				name: "Biofuel",
    				value: 2.1079537037037035,
    				rank: 5
    			},
    			{
    				name: "Wind",
    				value: 1.704435185185185,
    				rank: 6
    			},
    			{
    				name: "Solar",
    				value: 0.3014768518518518,
    				rank: 7
    			}
    		]
    	],
    	[
    		"12-31-2012",
    		[
    			{
    				name: "Oil",
    				value: 34.000902777777775,
    				rank: 0
    			},
    			{
    				name: "Hydro",
    				value: 26.405597222222223,
    				rank: 1
    			},
    			{
    				name: "Gas",
    				value: 17.850787037037037,
    				rank: 2
    			},
    			{
    				name: "Coal",
    				value: 12.243888888888888,
    				rank: 3
    			},
    			{
    				name: "Nuclear",
    				value: 4.108152777777778,
    				rank: 4
    			},
    			{
    				name: "Biofuel",
    				value: 2.1013657407407407,
    				rank: 5
    			},
    			{
    				name: "Wind",
    				value: 2.0621620370370373,
    				rank: 6
    			},
    			{
    				name: "Solar",
    				value: 0.4346296296296296,
    				rank: 7
    			}
    		]
    	],
    	[
    		"12-31-2013",
    		[
    			{
    				name: "Oil",
    				value: 33.62478341013825,
    				rank: 0
    			},
    			{
    				name: "Hydro",
    				value: 25.70906451612904,
    				rank: 1
    			},
    			{
    				name: "Gas",
    				value: 17.74215207373272,
    				rank: 2
    			},
    			{
    				name: "Coal",
    				value: 12.614889400921658,
    				rank: 3
    			},
    			{
    				name: "Nuclear",
    				value: 4.183004608294931,
    				rank: 4
    			},
    			{
    				name: "Wind",
    				value: 2.3537281105990786,
    				rank: 5
    			},
    			{
    				name: "Biofuel",
    				value: 2.3098663594470046,
    				rank: 6
    			},
    			{
    				name: "Solar",
    				value: 0.5864285714285714,
    				rank: 7
    			}
    		]
    	],
    	[
    		"12-31-2014",
    		[
    			{
    				name: "Oil",
    				value: 33.40847465437788,
    				rank: 0
    			},
    			{
    				name: "Hydro",
    				value: 24.49630414746544,
    				rank: 1
    			},
    			{
    				name: "Gas",
    				value: 18.35463133640553,
    				rank: 2
    			},
    			{
    				name: "Coal",
    				value: 12.610101382488478,
    				rank: 3
    			},
    			{
    				name: "Nuclear",
    				value: 4.100815668202765,
    				rank: 4
    			},
    			{
    				name: "Wind",
    				value: 2.815391705069124,
    				rank: 5
    			},
    			{
    				name: "Biofuel",
    				value: 2.510502304147465,
    				rank: 6
    			},
    			{
    				name: "Solar",
    				value: 0.8068387096774193,
    				rank: 7
    			}
    		]
    	],
    	[
    		"12-31-2015",
    		[
    			{
    				name: "Oil",
    				value: 32.6083732718894,
    				rank: 0
    			},
    			{
    				name: "Hydro",
    				value: 24.605760368663592,
    				rank: 1
    			},
    			{
    				name: "Gas",
    				value: 18.894161290322582,
    				rank: 2
    			},
    			{
    				name: "Coal",
    				value: 12.297124423963137,
    				rank: 3
    			},
    			{
    				name: "Nuclear",
    				value: 4.098907834101382,
    				rank: 4
    			},
    			{
    				name: "Wind",
    				value: 2.9277834101382485,
    				rank: 5
    			},
    			{
    				name: "Biofuel",
    				value: 2.548115207373272,
    				rank: 6
    			},
    			{
    				name: "Solar",
    				value: 1.1022764976958526,
    				rank: 7
    			}
    		]
    	],
    	[
    		"12-31-2016",
    		[
    			{
    				name: "Oil",
    				value: 31.87094009216589,
    				rank: 0
    			},
    			{
    				name: "Hydro",
    				value: 24.334857142857143,
    				rank: 1
    			},
    			{
    				name: "Gas",
    				value: 19.337119815668203,
    				rank: 2
    			},
    			{
    				name: "Coal",
    				value: 12.246023041474656,
    				rank: 3
    			},
    			{
    				name: "Nuclear",
    				value: 4.094202764976958,
    				rank: 4
    			},
    			{
    				name: "Wind",
    				value: 3.1789585253456223,
    				rank: 5
    			},
    			{
    				name: "Biofuel",
    				value: 2.5476774193548386,
    				rank: 6
    			},
    			{
    				name: "Solar",
    				value: 1.4894516129032258,
    				rank: 7
    			}
    		]
    	],
    	[
    		"12-31-2017",
    		[
    			{
    				name: "Oil",
    				value: 31.069198156682027,
    				rank: 0
    			},
    			{
    				name: "Hydro",
    				value: 24.644764976958523,
    				rank: 1
    			},
    			{
    				name: "Gas",
    				value: 19.526447004608293,
    				rank: 2
    			},
    			{
    				name: "Coal",
    				value: 11.802456221198156,
    				rank: 3
    			},
    			{
    				name: "Nuclear",
    				value: 3.965691244239632,
    				rank: 4
    			},
    			{
    				name: "Wind",
    				value: 3.466437788018433,
    				rank: 5
    			},
    			{
    				name: "Biofuel",
    				value: 2.583589861751152,
    				rank: 6
    			},
    			{
    				name: "Solar",
    				value: 2.020488479262673,
    				rank: 7
    			}
    		]
    	],
    	[
    		"12-31-2018",
    		[
    			{
    				name: "Oil",
    				value: 30.60206451612904,
    				rank: 0
    			},
    			{
    				name: "Hydro",
    				value: 23.813410138248848,
    				rank: 1
    			},
    			{
    				name: "Gas",
    				value: 20.2087603686636,
    				rank: 2
    			},
    			{
    				name: "Coal",
    				value: 11.516258064516128,
    				rank: 3
    			},
    			{
    				name: "Nuclear",
    				value: 4.083746543778802,
    				rank: 4
    			},
    			{
    				name: "Wind",
    				value: 3.8737834101382487,
    				rank: 5
    			},
    			{
    				name: "Biofuel",
    				value: 2.637493087557604,
    				rank: 6
    			},
    			{
    				name: "Solar",
    				value: 2.3407465437788018,
    				rank: 7
    			}
    		]
    	],
    	[
    		"12-31-2019",
    		[
    			{
    				name: "Oil",
    				value: 29.823300925925924,
    				rank: 0
    			},
    			{
    				name: "Hydro",
    				value: 24.61055555555556,
    				rank: 1
    			},
    			{
    				name: "Gas",
    				value: 20.30016203703704,
    				rank: 2
    			},
    			{
    				name: "Coal",
    				value: 10.830259259259256,
    				rank: 3
    			},
    			{
    				name: "Wind",
    				value: 4.084828703703703,
    				rank: 4
    			},
    			{
    				name: "Nuclear",
    				value: 3.962916666666666,
    				rank: 5
    			},
    			{
    				name: "Solar",
    				value: 2.766180555555556,
    				rank: 6
    			},
    			{
    				name: "Biofuel",
    				value: 2.68525,
    				rank: 7
    			}
    		]
    	],
    	[
    		"12-31-2020",
    		[
    			{
    				name: "Oil",
    				value: 29.94621296296296,
    				rank: 0
    			},
    			{
    				name: "Hydro",
    				value: 24.264787037037035,
    				rank: 1
    			},
    			{
    				name: "Gas",
    				value: 20.185532407407408,
    				rank: 2
    			},
    			{
    				name: "Coal",
    				value: 10.783851851851852,
    				rank: 3
    			},
    			{
    				name: "Wind",
    				value: 4.021282407407408,
    				rank: 4
    			},
    			{
    				name: "Nuclear",
    				value: 3.9837175925925927,
    				rank: 5
    			},
    			{
    				name: "Solar",
    				value: 3.167902777777778,
    				rank: 6
    			},
    			{
    				name: "Biofuel",
    				value: 2.743282407407407,
    				rank: 7
    			}
    		]
    	],
    	[
    		"12-31-2021",
    		[
    			{
    				name: "Gas",
    				value: 26.82171794871795,
    				rank: 0
    			},
    			{
    				name: "Hydro",
    				value: 20.429115384615383,
    				rank: 1
    			},
    			{
    				name: "Coal",
    				value: 18.586961538461537,
    				rank: 2
    			},
    			{
    				name: "Nuclear",
    				value: 9.067179487179487,
    				rank: 3
    			},
    			{
    				name: "Wind",
    				value: 8.378602564102563,
    				rank: 4
    			},
    			{
    				name: "Oil",
    				value: 6.564243589743589,
    				rank: 5
    			},
    			{
    				name: "Biofuel",
    				value: 4.342384615384615,
    				rank: 6
    			},
    			{
    				name: "Solar",
    				value: 4.159884615384615,
    				rank: 7
    			}
    		]
    	]
    ];

    /* src\Chart.svelte generated by Svelte v3.37.0 */
    const file$1 = "src\\Chart.svelte";

    // (63:0) {#if keyframes}
    function create_if_block(ctx) {
    	let timer;
    	let updating_currentKeyframe;
    	let t0;
    	let figure;
    	let div0;
    	let bars;
    	let t1;
    	let div1;
    	let axis;
    	let t2;
    	let div2;
    	let labels;
    	let t3;
    	let div3;
    	let ticker;
    	let figure_resize_listener;
    	let current;

    	function timer_currentKeyframe_binding(value) {
    		/*timer_currentKeyframe_binding*/ ctx[17](value);
    	}

    	let timer_props = {
    		keyframeCount: keyframes.length,
    		duration,
    		isEnabled: /*isEnabled*/ ctx[3]
    	};

    	if (/*currentKeyframe*/ ctx[2] !== void 0) {
    		timer_props.currentKeyframe = /*currentKeyframe*/ ctx[2];
    	}

    	timer = new Timer({ props: timer_props, $$inline: true });
    	binding_callbacks.push(() => bind(timer, "currentKeyframe", timer_currentKeyframe_binding));
    	timer.$on("end", /*end_handler*/ ctx[18]);
    	bars = new Chart_Bars({ props: { barCount }, $$inline: true });
    	axis = new Chart_Axis({ $$inline: true });
    	labels = new Chart_Labels({ props: { barCount }, $$inline: true });

    	ticker = new Chart_Ticker({
    			props: { date: /*keyframeDate*/ ctx[4] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(timer.$$.fragment);
    			t0 = space();
    			figure = element("figure");
    			div0 = element("div");
    			create_component(bars.$$.fragment);
    			t1 = space();
    			div1 = element("div");
    			create_component(axis.$$.fragment);
    			t2 = space();
    			div2 = element("div");
    			create_component(labels.$$.fragment);
    			t3 = space();
    			div3 = element("div");
    			create_component(ticker.$$.fragment);
    			attr_dev(div0, "class", "bars svelte-bipr8r");
    			add_location(div0, file$1, 71, 4, 2244);
    			attr_dev(div1, "class", "axis svelte-bipr8r");
    			add_location(div1, file$1, 75, 4, 2320);
    			attr_dev(div2, "class", "labels svelte-bipr8r");
    			add_location(div2, file$1, 79, 4, 2374);
    			attr_dev(div3, "class", "ticker svelte-bipr8r");
    			add_location(div3, file$1, 83, 4, 2454);
    			attr_dev(figure, "class", "svelte-bipr8r");
    			add_render_callback(() => /*figure_elementresize_handler*/ ctx[19].call(figure));
    			add_location(figure, file$1, 70, 2, 2162);
    		},
    		m: function mount(target, anchor) {
    			mount_component(timer, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, figure, anchor);
    			append_dev(figure, div0);
    			mount_component(bars, div0, null);
    			append_dev(figure, t1);
    			append_dev(figure, div1);
    			mount_component(axis, div1, null);
    			append_dev(figure, t2);
    			append_dev(figure, div2);
    			mount_component(labels, div2, null);
    			append_dev(figure, t3);
    			append_dev(figure, div3);
    			mount_component(ticker, div3, null);
    			figure_resize_listener = add_resize_listener(figure, /*figure_elementresize_handler*/ ctx[19].bind(figure));
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const timer_changes = {};
    			if (dirty & /*isEnabled*/ 8) timer_changes.isEnabled = /*isEnabled*/ ctx[3];

    			if (!updating_currentKeyframe && dirty & /*currentKeyframe*/ 4) {
    				updating_currentKeyframe = true;
    				timer_changes.currentKeyframe = /*currentKeyframe*/ ctx[2];
    				add_flush_callback(() => updating_currentKeyframe = false);
    			}

    			timer.$set(timer_changes);
    			const ticker_changes = {};
    			if (dirty & /*keyframeDate*/ 16) ticker_changes.date = /*keyframeDate*/ ctx[4];
    			ticker.$set(ticker_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(timer.$$.fragment, local);
    			transition_in(bars.$$.fragment, local);
    			transition_in(axis.$$.fragment, local);
    			transition_in(labels.$$.fragment, local);
    			transition_in(ticker.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(timer.$$.fragment, local);
    			transition_out(bars.$$.fragment, local);
    			transition_out(axis.$$.fragment, local);
    			transition_out(labels.$$.fragment, local);
    			transition_out(ticker.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(timer, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(figure);
    			destroy_component(bars);
    			destroy_component(axis);
    			destroy_component(labels);
    			destroy_component(ticker);
    			figure_resize_listener();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(63:0) {#if keyframes}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = keyframes && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (keyframes) if_block.p(ctx, dirty);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const duration = 300; // ms between keyframes
    const barCount = 8; // how many bars to show
    const barMargin = 4; // space between bars

    function instance$1($$self, $$props, $$invalidate) {
    	let width;
    	let height;
    	let barHeight;
    	let frameIndex;
    	let frame;
    	let keyframeDate;
    	let keyframeData;
    	let currentData;
    	let chartContext;
    	let $xMax;
    	let $dimensions;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Chart", slots, []);
    	const keyframeCount = keyframes.length; // number of keyframes
    	const names = keyframes[0][1].map(d => d.name); // all data names/labels
    	const dimensions = writable({});
    	validate_store(dimensions, "dimensions");
    	component_subscribe($$self, dimensions, value => $$invalidate(15, $dimensions = value));
    	const scales = writable({});
    	const data = tweened(null, { duration });
    	const xMax = tweened(null, { duration });
    	validate_store(xMax, "xMax");
    	component_subscribe($$self, xMax, value => $$invalidate(14, $xMax = value));
    	let figureWidth = 0;
    	let figureHeight = 0;
    	let currentKeyframe = 0;
    	let isEnabled = false;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Chart> was created with unknown prop '${key}'`);
    	});

    	function timer_currentKeyframe_binding(value) {
    		currentKeyframe = value;
    		$$invalidate(2, currentKeyframe);
    	}

    	const end_handler = () => $$invalidate(3, isEnabled = false);

    	function figure_elementresize_handler() {
    		figureWidth = this.offsetWidth;
    		figureHeight = this.offsetHeight;
    		$$invalidate(0, figureWidth);
    		$$invalidate(1, figureHeight);
    	}

    	$$self.$capture_state = () => ({
    		scaleLinear: linear,
    		setContext,
    		writable,
    		tweened,
    		Timer,
    		Bars: Chart_Bars,
    		Axis: Chart_Axis,
    		Labels: Chart_Labels,
    		Ticker: Chart_Ticker,
    		keyframes,
    		duration,
    		barCount,
    		barMargin,
    		keyframeCount,
    		names,
    		dimensions,
    		scales,
    		data,
    		xMax,
    		figureWidth,
    		figureHeight,
    		currentKeyframe,
    		isEnabled,
    		width,
    		height,
    		barHeight,
    		frameIndex,
    		frame,
    		keyframeDate,
    		keyframeData,
    		currentData,
    		$xMax,
    		$dimensions,
    		chartContext
    	});

    	$$self.$inject_state = $$props => {
    		if ("figureWidth" in $$props) $$invalidate(0, figureWidth = $$props.figureWidth);
    		if ("figureHeight" in $$props) $$invalidate(1, figureHeight = $$props.figureHeight);
    		if ("currentKeyframe" in $$props) $$invalidate(2, currentKeyframe = $$props.currentKeyframe);
    		if ("isEnabled" in $$props) $$invalidate(3, isEnabled = $$props.isEnabled);
    		if ("width" in $$props) $$invalidate(7, width = $$props.width);
    		if ("height" in $$props) $$invalidate(8, height = $$props.height);
    		if ("barHeight" in $$props) $$invalidate(9, barHeight = $$props.barHeight);
    		if ("frameIndex" in $$props) $$invalidate(10, frameIndex = $$props.frameIndex);
    		if ("frame" in $$props) $$invalidate(11, frame = $$props.frame);
    		if ("keyframeDate" in $$props) $$invalidate(4, keyframeDate = $$props.keyframeDate);
    		if ("keyframeData" in $$props) $$invalidate(12, keyframeData = $$props.keyframeData);
    		if ("currentData" in $$props) $$invalidate(13, currentData = $$props.currentData);
    		if ("chartContext" in $$props) $$invalidate(16, chartContext = $$props.chartContext);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*figureWidth*/ 1) {
    			// update dimensions
    			$$invalidate(7, width = figureWidth);
    		}

    		if ($$self.$$.dirty & /*figureHeight*/ 2) {
    			$$invalidate(8, height = figureHeight);
    		}

    		if ($$self.$$.dirty & /*height*/ 256) {
    			$$invalidate(9, barHeight = height / barCount - barMargin);
    		}

    		if ($$self.$$.dirty & /*currentKeyframe*/ 4) {
    			// update data
    			$$invalidate(3, isEnabled = currentKeyframe < keyframeCount);
    		}

    		if ($$self.$$.dirty & /*currentKeyframe*/ 4) {
    			$$invalidate(10, frameIndex = Math.min(currentKeyframe, keyframeCount - 1));
    		}

    		if ($$self.$$.dirty & /*frameIndex*/ 1024) {
    			$$invalidate(11, frame = keyframes[frameIndex]);
    		}

    		if ($$self.$$.dirty & /*frame*/ 2048) {
    			$$invalidate(4, keyframeDate = frame[0]);
    		}

    		if ($$self.$$.dirty & /*frame*/ 2048) {
    			$$invalidate(12, keyframeData = frame[1]);
    		}

    		if ($$self.$$.dirty & /*keyframeData*/ 4096) {
    			$$invalidate(13, currentData = names.map(name => ({
    				...keyframeData.find(d => d.name == name)
    			})));
    		}

    		if ($$self.$$.dirty & /*currentData*/ 8192) {
    			// update stores and context
    			data.set(currentData);
    		}

    		if ($$self.$$.dirty & /*width, height, barHeight*/ 896) {
    			dimensions.set({ width, height, barHeight, barMargin });
    		}

    		if ($$self.$$.dirty & /*keyframeData*/ 4096) {
    			xMax.set(Math.max(...keyframeData.map(d => d.value)));
    		}

    		if ($$self.$$.dirty & /*$xMax, $dimensions*/ 49152) {
    			scales.set({
    				x: linear().domain([0, $xMax]).range([0, $dimensions.width]),
    				y: linear().domain([0, barCount]).range([0, $dimensions.height])
    			});
    		}

    		if ($$self.$$.dirty & /*chartContext*/ 65536) {
    			setContext("Chart", chartContext);
    		}
    	};

    	$$invalidate(16, chartContext = { dimensions, scales, data, names });

    	return [
    		figureWidth,
    		figureHeight,
    		currentKeyframe,
    		isEnabled,
    		keyframeDate,
    		dimensions,
    		xMax,
    		width,
    		height,
    		barHeight,
    		frameIndex,
    		frame,
    		keyframeData,
    		currentData,
    		$xMax,
    		$dimensions,
    		chartContext,
    		timer_currentKeyframe_binding,
    		end_handler,
    		figure_elementresize_handler
    	];
    }

    class Chart extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Chart",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.37.0 */
    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let link0;
    	let t0;
    	let link1;
    	let t1;
    	let link2;
    	let t2;
    	let section0;
    	let h1;
    	let t4;
    	let p0;
    	let t5;
    	let strong0;
    	let a0;
    	let t7;
    	let t8;
    	let chart;
    	let t9;
    	let section1;
    	let p1;
    	let t10;
    	let a1;
    	let t12;
    	let strong1;
    	let t14;
    	let current;
    	chart = new Chart({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			link0 = element("link");
    			t0 = space();
    			link1 = element("link");
    			t1 = space();
    			link2 = element("link");
    			t2 = space();
    			section0 = element("section");
    			h1 = element("h1");
    			h1.textContent = "Sources of Electricity";
    			t4 = space();
    			p0 = element("p");
    			t5 = text("% of different energy sources utilized for electricity production throughout the world between 1989 and 2021.\r\n     Check out the design overview ");
    			strong0 = element("strong");
    			a0 = element("a");
    			a0.textContent = "here";
    			t7 = text(".");
    			t8 = space();
    			create_component(chart.$$.fragment);
    			t9 = space();
    			section1 = element("section");
    			p1 = element("p");
    			t10 = text("Data from ");
    			a1 = element("a");
    			a1.textContent = "Our world in data";
    			t12 = text(". This visualization was created for the ");
    			strong1 = element("strong");
    			strong1.textContent = "DSC 106: Intro to Data visualization";
    			t14 = text(" course.");
    			attr_dev(link0, "rel", "preconnect");
    			attr_dev(link0, "href", "https://fonts.googleapis.com");
    			add_location(link0, file, 5, 2, 72);
    			attr_dev(link1, "rel", "preconnect");
    			attr_dev(link1, "href", "https://fonts.gstatic.com");
    			attr_dev(link1, "crossorigin", "");
    			add_location(link1, file, 6, 2, 135);
    			attr_dev(link2, "href", "https://fonts.googleapis.com/css2?family=Annapurna+SIL:wght@400;700&family=Inter:wght@100..900&family=Roboto+Condensed:ital,wght@0,100..900;1,100..900&display=swap");
    			attr_dev(link2, "rel", "stylesheet");
    			add_location(link2, file, 7, 2, 207);
    			attr_dev(h1, "class", "svelte-bj4f4e");
    			add_location(h1, file, 10, 4, 436);
    			attr_dev(a0, "href", "design.html");
    			add_location(a0, file, 15, 43, 650);
    			add_location(strong0, file, 15, 35, 642);
    			attr_dev(p0, "class", "svelte-bj4f4e");
    			add_location(p0, file, 12, 4, 477);
    			attr_dev(section0, "class", "intro svelte-bj4f4e");
    			add_location(section0, file, 9, 2, 407);
    			attr_dev(a1, "href", "https://github.com/owid/energy-data?tab=readme-ov-file#data-on-energy-by-our-world-in-data");
    			add_location(a1, file, 24, 16, 792);
    			add_location(strong1, file, 27, 48, 982);
    			attr_dev(p1, "class", "svelte-bj4f4e");
    			add_location(p1, file, 23, 4, 771);
    			attr_dev(section1, "class", "outro svelte-bj4f4e");
    			add_location(section1, file, 22, 2, 742);
    			attr_dev(main, "class", "svelte-bj4f4e");
    			add_location(main, file, 4, 0, 62);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, link0);
    			append_dev(main, t0);
    			append_dev(main, link1);
    			append_dev(main, t1);
    			append_dev(main, link2);
    			append_dev(main, t2);
    			append_dev(main, section0);
    			append_dev(section0, h1);
    			append_dev(section0, t4);
    			append_dev(section0, p0);
    			append_dev(p0, t5);
    			append_dev(p0, strong0);
    			append_dev(strong0, a0);
    			append_dev(p0, t7);
    			append_dev(main, t8);
    			mount_component(chart, main, null);
    			append_dev(main, t9);
    			append_dev(main, section1);
    			append_dev(section1, p1);
    			append_dev(p1, t10);
    			append_dev(p1, a1);
    			append_dev(p1, t12);
    			append_dev(p1, strong1);
    			append_dev(p1, t14);
    			current = true;
    		},
    		p: noop$1,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(chart.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(chart.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(chart);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Chart });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
