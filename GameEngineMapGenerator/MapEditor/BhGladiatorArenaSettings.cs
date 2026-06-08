using System;
using System.Runtime.CompilerServices;
using Hex.Map;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace Hex.MapEditor
{
	public class BhGladiatorArenaSettings : MonoBehaviour
	{
		[SerializeField]
		private TextMeshProUGUI textRegistrStartWork;

		[SerializeField]
		private TextMeshProUGUI textRegistrStartBattle;

		[SerializeField]
		private Toggle toggleRegistrStartWork;

		[SerializeField]
		private Toggle toggleRegistrStartBattle;

		[SerializeField]
		private TMP_InputField inputFieldTimerDay;

		[SerializeField]
		private TMP_InputField inputFieldDelayedStart;

		private event Action buxp
		{
			[CompilerGenerated]
			add
			{
			}
			[CompilerGenerated]
			remove
			{
			}
		}

		public void Save(MapWinCondition _mapWinCondition)
		{
		}

		public void Load(MapWinCondition _mapWinCondition)
		{
		}

		public void nxc(Action a)
		{
		}

		private void nxd(bool a)
		{
		}

		private void nxe(string a)
		{
		}
	}
}
