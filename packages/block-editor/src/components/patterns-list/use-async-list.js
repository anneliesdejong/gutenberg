/**
 * WordPress dependencies
 */
import { useEffect, useReducer } from '@wordpress/element';
import { createQueue } from '@wordpress/priority-queue';

/**
 * Returns the first items from list that are present on state.
 *
 * @param {Array} list  New array.
 * @param {Array} state Current state.
 * @return {Array} First items present iin state.
 */
function getFirstItemsPresentInState( list, state ) {
	const firstItems = [];
	let index = 0;
	let alreadyRendered = false;
	do {
		const item = list[ index ];
		alreadyRendered = state.indexOf( item ) !== -1;
		if ( alreadyRendered ) {
			firstItems.push( item );
		}
		index++;
	} while ( alreadyRendered || index === list.length );
	return firstItems;
}

/**
 * Reducer keeping track of a list of appended items.
 *
 * @param {Array}  state  Current state
 * @param {Object} action Action
 *
 * @return {Array} update state.
 */
function listReducer( state, action ) {
	if ( action.type === 'reset' ) {
		return action.list;
	}

	if ( action.type === 'append' ) {
		return [ ...state, action.item ];
	}

	return state;
}

/**
 * React hook returns an array which items get asynchronously appended from a source array.
 * This behavior is useful if we want to render a list of items asynchronously for performance reasons.
 *
 * @param {Array} list Source array.
 * @return {Array} Async array.
 */
function useAsyncList( list ) {
	const [ current, dispatch ] = useReducer( listReducer, [] );

	useEffect( () => {
		// On reset, we keep the first items that were previously rendered.
		const firstItems = getFirstItemsPresentInState( list, current );
		dispatch( {
			type: 'reset',
			list: firstItems,
		} );
		const asyncQueue = createQueue();
		const append = ( index ) => () => {
			if ( list.length <= index ) {
				return;
			}
			dispatch( { type: 'append', item: list[ index ] } );
			asyncQueue.add( {}, append( index + 1 ) );
		};
		asyncQueue.add( {}, append( firstItems.length ) );

		return () => asyncQueue.reset();
	}, [ list ] );

	return current;
}

export default useAsyncList;