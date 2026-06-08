using System.Collections.Generic;
using Hex.Map;
using Hex.UI;
using TMPro;
using UnityEngine;

namespace Hex.MapEditor
{
	public sealed class BhWinConditions : BhScreenElement
	{
		public static BhWinConditions me;

		[SerializeField]
		private List<BhWinCondition> conditions;

		[SerializeField]
		private TMP_InputField armyDesertion;

		[SerializeField]
		private BhGladiatorArenaSettings gladiatorArenaSettings;

		[SerializeField]
		private BhTournamentSettings tournamentSettings;

		private Dictionary<TypeWinCondition, BhWinCondition> buxs;

		private List<MapWinCondition> buxt;

		private void Start()
		{
		}

		public override void Show()
		{
		}

		public override void Hide()
		{
		}

		public void nxv(MapWinCondition[] a)
		{
		}

		private void OnChange()
		{
		}

		private MapWinCondition Generate(BhWinCondition _condition)
		{
			return null;
		}
	}
}
