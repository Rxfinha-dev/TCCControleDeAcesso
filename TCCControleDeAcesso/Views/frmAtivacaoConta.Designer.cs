namespace TCCControleDeAcesso.Views
{
    partial class frmAtivacaoConta
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.txtAtivacao = new System.Windows.Forms.TextBox();
            this.lblConfirmacao = new System.Windows.Forms.Label();
            this.btnAtivacao = new System.Windows.Forms.Button();
            this.SuspendLayout();
            // 
            // txtAtivacao
            // 
            this.txtAtivacao.Location = new System.Drawing.Point(132, 142);
            this.txtAtivacao.Name = "txtAtivacao";
            this.txtAtivacao.Size = new System.Drawing.Size(209, 20);
            this.txtAtivacao.TabIndex = 9;
            // 
            // lblConfirmacao
            // 
            this.lblConfirmacao.AutoSize = true;
            this.lblConfirmacao.Font = new System.Drawing.Font("Microsoft Sans Serif", 9F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblConfirmacao.Location = new System.Drawing.Point(25, 114);
            this.lblConfirmacao.Name = "lblConfirmacao";
            this.lblConfirmacao.Size = new System.Drawing.Size(467, 15);
            this.lblConfirmacao.TabIndex = 8;
            this.lblConfirmacao.Text = "Insira aqui a senha que enviamos no seu email para ativação da conta :";
            // 
            // btnAtivacao
            // 
            this.btnAtivacao.Location = new System.Drawing.Point(196, 168);
            this.btnAtivacao.Name = "btnAtivacao";
            this.btnAtivacao.Size = new System.Drawing.Size(75, 23);
            this.btnAtivacao.TabIndex = 12;
            this.btnAtivacao.Text = "Ativar Conta";
            this.btnAtivacao.UseVisualStyleBackColor = true;
            this.btnAtivacao.Click += new System.EventHandler(this.btnAtivacao_Click);
            // 
            // frmAtivacaoConta
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(492, 368);
            this.Controls.Add(this.btnAtivacao);
            this.Controls.Add(this.txtAtivacao);
            this.Controls.Add(this.lblConfirmacao);
            this.Name = "frmAtivacaoConta";
            this.Text = "frmAtivacaoConta";
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion
        private System.Windows.Forms.TextBox txtAtivacao;
        private System.Windows.Forms.Label lblConfirmacao;
        private System.Windows.Forms.Button btnAtivacao;
    }
}