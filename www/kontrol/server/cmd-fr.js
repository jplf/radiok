//__________________________________________________________________________
/**
 * Fonteny javascript library - December 2014

 * This software is governed by the
 * Gnu general public license (http://www.gnu.org/licenses/gpl.html)

 * This is the dictionary used by the french version of the application.
 * Actually it has been only tested with the remote version of the voice
 * recognition program based on the google api.
 *
 * @author Jean-Paul Le Fèvre <lefevre@fonteny.org>
*/
//__________________________________________________________________________

"use strict";

module.exports = {
    /**
     * Words leading to the same action are grouped in list of
     * synonyms.
     * Some lists are actually in use.
     */
    language:  'french',

    yesList:   ['oui', 'dac', 'absolument'],
    noList:    ['non', 'refus'],
    plusList:  ['plus fort', 'fortement', 'augmenter', 'augmenté',
                'plus haut'],
    minusList: ['moins fort', 'doucement', 'diminuer', 'diminué',
                'plus bas'],
    workList:  ['musique', 'jouer', 'commencer', 'allumer',
                'joué', 'commencé', 'allumé', 'radio'],
    stopList:  ['silence', 'stop', 'terminer', 'terminé', 'éteindre', 'finir',
                'arrêter', 'arrêté', , 'arrêt'],
    digitList: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    indexList: ['premier', 'précédent', 'suivant', 'dernier',
                'première', 'précédente', 'suivante', 'dernière'],
    whichList: ['laquelle', 'lequel', 'selection', 'station', 'poste'],
    setList:   ['alarme', 'état', 'réveil'],
    nameList:  ['Fip radio', 'France Inter', 'France Musique', 'France Culture',
                'chante France', 'TSF Jazz']
}
//__________________________________________________________________________
