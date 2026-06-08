using Hex.Map;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace Hex.MapEditor
{
	public class BhSpawnItemView : MonoBehaviour
	{
		[SerializeField]
		private TextMeshProUGUI title;

		[SerializeField]
		private TMP_Dropdown spawnType;

		[SerializeField]
		private TMP_Dropdown spawnPointType;

		[SerializeField]
		private Toggle isLockedToggle;

		private GameObject buum;

		private string buun;

		private bool buuo;

		private PropSpawn buup;

		private int buuq;

		private const string buur = "hero-spawner";

		private const string buus = "city-spawner";

		public void Init(PropSpawn _propSpawn, int _idx, GameObject _pos, Color _color)
		{
		}

		public void OnClick()
		{
		}

		public void UpdateValue()
		{
		}
	}
}
