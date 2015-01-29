//__________________________________________________________________________
/**
 * Fonteny javascript library - December 2014

 * This software is governed by the
 * Gnu general public license (http://www.gnu.org/licenses/gpl.html)

 * This is the dictionnary used by the french version of the application.
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
     */
    language:  'french',

    yesList:   ['oui', 'dac', 'absolument'],
    noList:    ['non', 'refus'],
    plusList:  ['plus', 'fort', 'fortement', 'augmenter', 'augmenté',
                'plus fort', 'plus haut'],
    minusList: ['moins', 'doux', 'doucement', 'diminuer', 'diminué',
                'plus bas', 'moins fort'],
    workList:  ['musique', 'jouer', 'commencer', 'allumer',
                'joué', 'commencé', 'allumé','radio'],
    stopList:  ['silence', 'stop', 'terminer', 'terminé', 'éteindre', 'finir',
                'arrêter', 'arrêté', , 'arrêt'],
    digitList: ['zero', 'un', 'deux', 'trois', 'quatre', 'cinq',
                'six', 'sept', 'huit', 'neuf', 'dix'],
    indexList: ['premier', 'précédent', 'suivant', 'dernier',
                'première', 'précédente', 'suivante', 'dernière'],
    whichList: ['lequel', 'laquelle', 'selection', 'station', 'poste'],
    setList:   ['alarme', 'état', 'réveil'],
    nameList:  ['Fip Radio', 'France Inter', 'France Musique', 'France Culture',
                'Chante France', 'TSF Jazz']
}
//__________________________________________________________________________
