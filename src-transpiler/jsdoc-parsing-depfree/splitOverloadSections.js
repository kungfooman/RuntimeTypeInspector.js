/**
 * Separates overload signatures from the implementation documentation.
 * A return tag terminates a signature when another parameter follows it.
 * A section absorbs only `@param`/`@returns` rows: a `@callback`,
 * `@type`, or second `@overload` marker terminates the section tail,
 * exactly like tsc (the marker parses as its own tag, never as section
 * content). Template position decides the route: a template-first part
 * stalls before any row (tsc emits the empty marker and strands the
 * rows to the tail), a template after rows rode the same marker that
 * holds them (the piece stays whole and the entry absorbs it), and a
 * template before the marker is flat scope (no prepend splices it in).
 * The tail binds flat as the implementation.
 * A `@template` before the first marker is flat scope, never section
 * content: the split returns it separately so the fold can scope every
 * section under it (matching tsc, where the tag parses outside every
 * marker span) without splicing text into any section.
 * @param {string[]} blocks - Documentation blocks in source order.
 * @returns {{overloads: string[], impl: string|null, preMarker: string}} Sections, tail, and pre-marker scope.
 * @example
 * splitOverloadSections(['* @overload @param {number} x', '* @param {any} x']);
 * // {overloads: [' @param {number} x'], impl: '* @param {any} x'}
 */
function splitOverloadSections(blocks) {
  const overloads = [];
  let impl = null;
  let preMarker = '';
  for (const block of blocks) {
    const pieces = block.split(/@overload\b/);
    if (pieces.length === 1) {
      if (/@param\b/.test(block)) impl = block;
      continue;
    }
    if (/@param\b/.test(pieces[0])) {
      impl = pieces[0];
    } else {
      preMarker += pieces[0];
    }
    for (const part of pieces.slice(1)) {
      const piece = part;
      // Template position decides the route. A template-first part
      // stalls before any row: tsc emits the empty marker and strands
      // everything after it, so the stranded part routes to the tail
      // that binds flat, with an empty entry standing in. A template
      // after any row rode the same marker that holds those rows (one
      // span, errors included): the piece stays whole so the entry
      // absorbs it exactly as tsc parses it. A template before the
      // marker is flat scope, never section content: it binds from the
      // whole-comment scan on both sides, so no prepend splices it in.
      // The gate tolerates ` * ` leaders: delimited comments reach the
      // split with stars intact, and bare tag text must route the same
      // way, so stars and spaces skip together before the marker.
      if (/^[\s*]*@template\b/.test(piece)) {
        overloads.push('');
        impl = (impl ?? '') + piece;
        continue;
      }
      // A section-breaking marker ends the section: the break text
      // belongs to the tail, never to the entry. A head with no rows
      // still lowers (tsc emits the empty entry for a lone marker).
      const breaker = /@(callback|type|overload)\b/.exec(piece);
      if (breaker) {
        const head = piece.slice(0, breaker.index);
        const tail = piece.slice(breaker.index);
        overloads.push(head);
        impl = (impl ?? '') + tail;
        continue;
      }
      const returnTag = /@returns?\b[^\n@]*/.exec(piece);
      if (returnTag) {
        const end = returnTag.index + returnTag[0].length;
        const after = piece.slice(end);
        if (/@param\b/.test(after)) {
          overloads.push(piece.slice(0, end));
          impl = after;
          continue;
        }
      }
      overloads.push(piece);
    }
  }
  return {overloads, impl, preMarker};
}
export {splitOverloadSections};
