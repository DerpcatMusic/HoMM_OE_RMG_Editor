using System.Runtime.CompilerServices;
using Hex.Map;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace Hex.MapEditor
{
	public class BhResourceRewardItem : MonoBehaviour
	{
		[SerializeField]
		private TMP_Dropdown resDrop;

		[SerializeField]
		private TMP_InputField value;

		[SerializeField]
		private TMP_InputField percent;

		[SerializeField]
		private TextMeshProUGUI percentLabel;

		[SerializeField]
		private Toggle forced;

		[SerializeField]
		private BhPropertiesResourceReward reward;

		private int burm;

		private EResTypes burn;

		private bool buro;

		public int burl
		{
			[CompilerGenerated]
			get
			{
				return 0;
			}
			[CompilerGenerated]
			private set
			{
			}
		}

		public bool cmoy => false;

		public void nsq(EResTypes a, int b, int c, int d, bool e)
		{
		}

		public void nsr(int a)
		{
		}

		public void ShowWeight()
		{
		}

		public void nss()
		{
		}

		public void UpdateVal()
		{
		}

		public void UpdateForced()
		{
		}

		public void Remove()
		{
		}

		public PropRes nst()
		{
			return null;
		}
	}
}
