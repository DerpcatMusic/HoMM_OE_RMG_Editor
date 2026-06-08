using Hex.UI;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace Hex.MapEditor
{
	public class BhMapSettings : BhScreenElement
	{
		[SerializeField]
		private TMP_InputField mapName;

		[SerializeField]
		private TMP_InputField mapDesc;

		[SerializeField]
		private Toggle mapNameFromLoc;

		[SerializeField]
		private Toggle mapDescFromLoc;

		public override void Show()
		{
		}

		public void Save()
		{
		}
	}
}
